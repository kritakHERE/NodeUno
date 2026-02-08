import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PROMPTS } from "../constants";
import { ApiKeys, ModelProvider } from "../types";

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || '').trim().replace(/\/$/, '');
const withBackend = (path: string) => (BACKEND_URL ? `${BACKEND_URL}${path}` : path);

const getGeminiAI = (apiKey?: string) => {
  const key = (apiKey || '').trim();
  if (!key) {
    throw new Error("Gemini API key missing. Add it in Setup → Configure Keys.");
  }
  return new GoogleGenAI({ apiKey: key });
};

const extractJson = (text: string) => {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? jsonMatch[0] : text;
};

const sanitizeHierarchy = (items: any[], parentLevel: string = '') => {
  return items.map((item, index) => {
    const currentLevel = parentLevel ? `${parentLevel}.${index + 1}` : `${index + 1}`;
    let children = item.children || [];
    if (children.length > 0) children = sanitizeHierarchy(children, currentLevel);
    return { ...item, id: item.id || `node_${currentLevel}_${Date.now()}_${Math.random()}`, level: currentLevel, children };
  });
};

async function callGroqAPI(
  model: string,
  systemInstruction: string,
  prompt: string,
  apiKey?: string,
  jsonMode: boolean = true,
): Promise<string> {
  const finalSystem = jsonMode && !systemInstruction.toUpperCase().includes('JSON')
    ? systemInstruction + " Respond in JSON."
    : systemInstruction;

  const messages = [
    { role: "system", content: finalSystem },
    { role: "user", content: prompt },
  ];

  const key = (apiKey || '').trim();
  const effectiveModel = model || "llama-3.3-70b-versatile";
  const temperature = 0.7;
  const max_tokens = 768;

  // If the user didn't supply a key, use the backend proxy (system key stays server-side).
  if (!key) {
    const response = await fetch(withBackend('/api/chat'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, model: effectiveModel, temperature, max_tokens, jsonMode }),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const message = data?.error || `Groq backend error: ${response.status}`;
      throw new Error(message);
    }
    return data?.reply ?? '';
  }

  const body: any = { model: effectiveModel, messages, temperature, max_tokens };
  if (jsonMode) body.response_format = { type: "json_object" };

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    if (response.status === 429) throw new Error("Groq rate limit reached (429)");
    if ((response.status === 400 && jsonMode) || response.status >= 500) {
      console.warn("Groq error with JSON mode, retrying text mode...");
      return callGroqAPI(model, systemInstruction, prompt, apiKey, false);
    }
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content ?? '';
}

async function callOpenAICompatibleAPI(
  url: string,
  model: string,
  apiKey: string,
  systemInstruction: string,
  prompt: string,
  jsonMode: boolean = true,
): Promise<string> {
  const finalSystem = jsonMode && !systemInstruction.toUpperCase().includes('JSON')
    ? systemInstruction + " Respond in JSON."
    : systemInstruction;

  const isOpenAI = url.includes("api.openai.com");
  const isCerebras = url.includes("cerebras.ai");
  const useJsonParam = jsonMode && (isOpenAI || isCerebras || model.includes("gpt") || model.includes("turbo") || model.includes("json"));

  const body: any = {
    model,
    messages: [
      { role: "system", content: finalSystem },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 768,
  };
  if (useJsonParam) body.response_format = { type: "json_object" };

  const key = (apiKey || '').trim();

  // If OpenRouter key isn't provided, use backend proxy.
  if (!key && url.includes('openrouter.ai')) {
    const response = await fetch(withBackend('/api/openrouter/chat'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: body.messages,
        model: body.model,
        temperature: body.temperature,
        max_tokens: body.max_tokens,
        jsonMode,
      }),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const message = data?.error || `OpenRouter backend error: ${response.status}`;
      throw new Error(message);
    }

    return data?.reply ?? '';
  }

  if (!key) throw new Error("API key required for this provider. Add it in Setup → Configure Keys.");

  const headers: any = { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" };
  if (url.includes("openrouter")) {
    headers["HTTP-Referer"] = window.location.origin;
    headers["X-Title"] = "NodeUno";
  }

  const response = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  if (!response.ok) {
    if (response.status === 400 && jsonMode) {
      return callOpenAICompatibleAPI(url, model, apiKey, systemInstruction, prompt, false);
    }
    throw new Error(`API error: ${response.status} from ${url}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content ?? '';
}

async function callGeminiAPI(
  model: string,
  systemInstruction: string,
  prompt: string,
  apiKey?: string,
  jsonMode: boolean = true,
): Promise<string> {
  const ai = getGeminiAI(apiKey);
  const response = await ai.models.generateContent({
    model: model || 'gemini-2.0-flash-exp',
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: jsonMode ? 'application/json' : 'text/plain',
    },
  });
  if (!response.text) throw new Error("Gemini returned empty response");
  return response.text;
}

async function generateHybridContent(
  systemPrompt: string,
  userPrompt: string,
  provider: ModelProvider,
  modelId: string,
  apiKeys: ApiKeys,
  jsonMode: boolean = true,
): Promise<string> {
  const errors: string[] = [];

  // 1) Selected provider
  try {
    switch (provider) {
      case 'gemini':
        return await callGeminiAPI(modelId || 'gemini-2.0-flash-exp', systemPrompt, userPrompt, apiKeys.gemini, jsonMode);
      case 'groq':
        return await callGroqAPI(modelId || 'llama-3.3-70b-versatile', systemPrompt, userPrompt, apiKeys.groq, jsonMode);
      case 'openai':
        return await callOpenAICompatibleAPI('https://api.openai.com/v1/chat/completions', modelId || 'gpt-4o-mini', apiKeys.openai || '', systemPrompt, userPrompt, jsonMode);
      case 'openrouter':
        return await callOpenAICompatibleAPI('https://openrouter.ai/api/v1/chat/completions', modelId || 'mistralai/mistral-7b-instruct:free', apiKeys.openrouter || '', systemPrompt, userPrompt, jsonMode);
      case 'cerebras':
        return await callOpenAICompatibleAPI('https://api.cerebras.ai/v1/chat/completions', modelId || 'llama3.1-70b', apiKeys.cerebras || '', systemPrompt, userPrompt, jsonMode);
    }
  } catch (e: any) {
    console.warn(`Primary provider ${provider} failed:`, e?.message || e);
    errors.push(`${provider}: ${e?.message || 'Unknown error'}`);
  }

  // 2) Fallbacks
  if (provider !== 'groq') {
    try {
      return await callGroqAPI('llama-3.3-70b-versatile', systemPrompt, userPrompt, apiKeys.groq, jsonMode);
    } catch (e: any) {
      errors.push(`Fallback groq: ${e?.message || 'Unknown error'}`);
    }
  }

  if (provider !== 'openrouter') {
    try {
      return await callOpenAICompatibleAPI('https://openrouter.ai/api/v1/chat/completions', 'mistralai/mistral-7b-instruct:free', apiKeys.openrouter || '', systemPrompt, userPrompt, jsonMode);
    } catch (e: any) {
      errors.push(`Fallback openrouter: ${e?.message || 'Unknown error'}`);
    }
  }

  throw new Error(`All AI providers failed. Errors: ${errors.join(' | ')}`);
}

// --- DICTIONARY ---

export const fetchDictionaryDefinition = async (word: string): Promise<string | null> => {
  try {
    const cleanWord = word.trim().split(' ')[0];
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${cleanWord}`);
    if (!response.ok) return null;
    const data = await response.json();
    const firstDef = data[0]?.meanings[0]?.definitions[0]?.definition;
    return firstDef || null;
  } catch {
    return null;
  }
};

// --- CORE GENERATION FUNCTIONS ---

export const generateCurriculum = async (
  goal: string,
  provider: ModelProvider,
  modelId: string,
  apiKeys: ApiKeys,
  level: string,
  existingContent?: string,
  userInstructions?: string,
) => {
  try {
    let prompt = `User Goal: ${goal}. Target Level: ${level}.`;
    if (userInstructions) prompt += `\nUSER INSTRUCTIONS: ${userInstructions}`;
    let system = SYSTEM_PROMPTS.CURRICULUM;
    if (existingContent) {
      system = "Reorganize the provided content into a clean JSON hierarchy following the strict format.";
      prompt += `\nEXISTING CONTENT: ${existingContent.substring(0, 15000)}`;
    }
    const text = await generateHybridContent(system, prompt, provider, modelId, apiKeys, true);
    const parsed = JSON.parse(extractJson(text));
    const items = Array.isArray(parsed) ? parsed : (parsed.curriculum || parsed.topics || []);
    return sanitizeHierarchy(items);
  } catch (e) {
    console.error("Curriculum generation failed", e);
    return [];
  }
};

export const generateTopicCore = async (
  topic: string,
  parentContext: string,
  provider: ModelProvider,
  modelId: string,
  apiKeys: ApiKeys,
  level: string,
  userInstructions?: string,
  isDeepDive: boolean = false,
) => {
  try {
    let prompt = `Topic: ${topic}.\nContext/Parent Topic: ${parentContext}.\nTarget Level: ${level}.`;
    if (userInstructions) prompt += `\nUSER REQUEST/INSTRUCTIONS: ${userInstructions}`;
    const systemPrompt = isDeepDive ? SYSTEM_PROMPTS.DEEP_DIVE : SYSTEM_PROMPTS.TOPIC_CORE;
    const text = await generateHybridContent(systemPrompt, prompt, provider, modelId, apiKeys, true);
    return JSON.parse(extractJson(text));
  } catch {
    return null;
  }
};

export const generateEssentials = async (topic: string, provider: ModelProvider, modelId: string, apiKeys: ApiKeys, level: string, userInstructions?: string) => {
  try {
    let prompt = `Topic: ${topic}. Level: ${level}.`;
    if (userInstructions) prompt += `\nINSTRUCTIONS: ${userInstructions}`;
    const text = await generateHybridContent(SYSTEM_PROMPTS.ESSENTIALS, prompt, provider, modelId, apiKeys, true);
    return JSON.parse(extractJson(text)).simpleExplanation;
  } catch {
    return "Essentials unavailable.";
  }
};

export const generateSignificance = async (topic: string, provider: ModelProvider, modelId: string, apiKeys: ApiKeys, level: string, userInstructions?: string) => {
  try {
    let prompt = `Topic: ${topic}. Level: ${level}.`;
    if (userInstructions) prompt += `\nINSTRUCTIONS: ${userInstructions}`;
    const text = await generateHybridContent(SYSTEM_PROMPTS.SIGNIFICANCE, prompt, provider, modelId, apiKeys, true);
    return JSON.parse(extractJson(text)).significance;
  } catch {
    return "Significance unavailable.";
  }
};

export const generateContext = async (topic: string, provider: ModelProvider, modelId: string, apiKeys: ApiKeys, level: string, userInstructions?: string) => {
  try {
    let prompt = `Topic: ${topic}. Level: ${level}.`;
    if (userInstructions) prompt += `\nINSTRUCTIONS: ${userInstructions}`;
    const text = await generateHybridContent(SYSTEM_PROMPTS.CONTEXT, prompt, provider, modelId, apiKeys, true);
    return JSON.parse(extractJson(text)).context;
  } catch {
    return "Context unavailable.";
  }
};

export const expandCurriculum = async (parentLabel: string, existingChildrenLabels: string[], provider: ModelProvider, modelId: string, apiKeys: ApiKeys, level: string) => {
  try {
    const prompt = `Generate 4 NEW subtopics for "${parentLabel}". Exclude: ${existingChildrenLabels.join(', ')}. Level: ${level}.\n    Output ONLY JSON: { "subtopics": [ { "label": "Name", "description": "Reasoning" } ] }`;
    const text = await generateHybridContent("You are a curriculum expert.", prompt, provider, modelId, apiKeys, true);
    const json = JSON.parse(extractJson(text));
    return json.subtopics || [];
  } catch {
    return [];
  }
};

export const expandLevel1Curriculum = async (goal: string, existingLabels: string[], provider: ModelProvider, modelId: string, apiKeys: ApiKeys, level: string) => {
  try {
    const prompt = `Goal: "${goal}". Level: ${level}. Existing: ${existingLabels.join(', ')}.\n    Generate 4 NEW top-level modules. Output ONLY JSON: { "modules": [ { "label": "Name", "description": "Reasoning" } ] }`;
    const text = await generateHybridContent("You are a curriculum architect.", prompt, provider, modelId, apiKeys, true);
    const json = JSON.parse(extractJson(text));
    return json.modules || [];
  } catch {
    return [];
  }
};

export const fetchTopicResources = async (
  query: string,
  type: 'youtube' | 'trends' | 'images',
  _excludeUris: string[] = [],
  _level?: string,
  _context?: string,
  _provider?: ModelProvider,
  _modelId?: string,
  apiKeys?: ApiKeys,
) => {
  const getFallback = () => {
    if (type === 'youtube') return [{ title: `Search YouTube: ${query}`, uri: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}` }];
    if (type === 'images') return [{ title: `Search Images: ${query}`, uri: `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}` }];
    return [{ title: `Google News: ${query}`, uri: `https://www.google.com/search?tbm=nws&q=${encodeURIComponent(query)}` }];
  };

  try {
    const ai = getGeminiAI(apiKeys?.gemini);
    const prompt = type === 'youtube'
      ? `List 3 YouTube video URLs for "${query}"`
      : type === 'trends'
        ? `List 3 news URLs about "${query}"`
        : `List 3 image/diagram URLs that explain "${query}"`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] },
    });
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const resources = chunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({ title: chunk.web?.title || 'Resource', uri: chunk.web?.uri || '' }))
      .slice(0, 4);
    return resources.length > 0 ? resources : getFallback();
  } catch {
    return getFallback();
  }
};

export const getDefinition = async (word: string, context: string, provider: ModelProvider, modelId: string, apiKeys: ApiKeys, level: string) => {
  if (word.trim().split(' ').length === 1) {
    const dictDef = await fetchDictionaryDefinition(word);
    if (dictDef) return { word, text: dictDef, source: 'Dictionary' };
  }
  try {
    const prompt = `Define "${word}" inside context: ${context}. Level: ${level}. Brief.`;
    const text = await generateHybridContent('', prompt, provider, modelId, apiKeys, false);
    return { word, text, source: 'AI' };
  } catch {
    return null;
  }
};

export const generateSearchQueries = async (topic: string, provider: ModelProvider, modelId: string, apiKeys: ApiKeys, level: string) => {
  try {
    const text = await generateHybridContent(SYSTEM_PROMPTS.QUERIES, `Topic: ${topic}. Level: ${level}.`, provider, modelId, apiKeys, true);
    return JSON.parse(extractJson(text)).queries || [];
  } catch {
    return [`${topic} tutorial`];
  }
};

export const generateConnection = async (nodeLabels: string[], provider: ModelProvider, modelId: string, apiKeys: ApiKeys, level: string) => {
  try {
    const prompt = `Nodes: ${nodeLabels.join(', ')}. Level: ${level}.`;
    const text = await generateHybridContent(SYSTEM_PROMPTS.CONNECTIONS, prompt, provider, modelId, apiKeys, true);
    const json = JSON.parse(extractJson(text));
    return json && json.label ? json : null;
  } catch {
    return null;
  }
};
