import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Groq from 'groq-sdk';

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

const groqApiKey = process.env.GROQ_API_KEY;
if (!groqApiKey) {
  // Fail fast so you don't accidentally run a client that can never succeed.
  console.error('Missing GROQ_API_KEY in environment (.env)');
}

const groq = new Groq({ apiKey: groqApiKey });

const openRouterApiKey = process.env.OPENROUTER_API_KEY;
if (!openRouterApiKey) {
  console.error('Missing OPENROUTER_API_KEY in environment (.env)');
}

const isValidMessages = (messages) => {
  if (!Array.isArray(messages) || messages.length === 0) return false;
  return messages.every(
    (m) =>
      m &&
      typeof m === 'object' &&
      typeof m.role === 'string' &&
      typeof m.content === 'string',
  );
};

app.post('/api/chat', async (req, res) => {
  try {
    const {
      messages,
      model,
      temperature,
      max_tokens,
      jsonMode,
    } = req.body || {};

    if (!groqApiKey) {
      return res.status(500).json({ error: 'Server misconfigured: GROQ_API_KEY missing.' });
    }

    if (!isValidMessages(messages)) {
      return res.status(400).json({ error: 'Invalid request: messages must be a non-empty array of {role, content}.' });
    }

    const body = {
      model: typeof model === 'string' && model.trim() ? model.trim() : 'llama-3.3-70b-versatile',
      messages,
      temperature: typeof temperature === 'number' ? temperature : 0.7,
      max_tokens: typeof max_tokens === 'number' ? max_tokens : 512,
    };

    if (jsonMode) body.response_format = { type: 'json_object' };

    let completion;
    try {
      completion = await groq.chat.completions.create(body);
    } catch (err) {
      // Some models/configs reject json_object mode. Retry once without it.
      if (jsonMode) {
        const retryBody = { ...body };
        delete retryBody.response_format;
        completion = await groq.chat.completions.create(retryBody);
      } else {
        throw err;
      }
    }

    const reply = completion?.choices?.[0]?.message?.content ?? '';
    return res.json({ reply });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
});

app.post('/api/openrouter/chat', async (req, res) => {
  try {
    const {
      messages,
      model,
      temperature,
      max_tokens,
      jsonMode,
      reasoning,
    } = req.body || {};

    if (!openRouterApiKey) {
      return res.status(500).json({ error: 'Server misconfigured: OPENROUTER_API_KEY missing.' });
    }

    if (!isValidMessages(messages)) {
      return res.status(400).json({ error: 'Invalid request: messages must be a non-empty array of {role, content}.' });
    }

    const origin =
      (typeof req.headers.origin === 'string' && req.headers.origin) ||
      process.env.OPENROUTER_HTTP_REFERER ||
      'http://localhost:3000';

    const title = process.env.OPENROUTER_APP_TITLE || 'NodeUno';

    const body = {
      model: typeof model === 'string' && model.trim()
        ? model.trim()
        : 'meta-llama/llama-3.1-70b-instruct',
      messages,
      temperature: typeof temperature === 'number' ? temperature : 0.7,
      max_tokens: typeof max_tokens === 'number' ? max_tokens : 512,
    };

    const doRequest = async (withJsonFormat) => {
      const requestBody = { ...body };
      if (withJsonFormat) requestBody.response_format = { type: 'json_object' };
      if (reasoning && (typeof reasoning === 'object' || typeof reasoning === 'boolean')) {
        requestBody.reasoning = reasoning;
      }

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openRouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': origin,
          'X-Title': title,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json().catch(() => null);
      return { response, data };
    };

    let result = await doRequest(Boolean(jsonMode));
    if (!result.response.ok && jsonMode) {
      // Retry once without response_format (some models reject json_object)
      result = await doRequest(false);
    }

    if (!result.response.ok) {
      const message =
        result.data?.error?.message ||
        result.data?.error ||
        `OpenRouter API Error: ${result.response.status}`;
      return res.status(502).json({ error: message });
    }

    const message = result.data?.choices?.[0]?.message ?? null;
    const reply = message?.content ?? '';
    return res.json({ reply, message });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
});

const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
  console.log(`Groq backend running on port ${port}`);
});
