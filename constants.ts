
export const PHYSICAL_ACTIVITIES = [
  "Go touch some grass, literally.",
  "Drink a large glass of water.",
  "Do 10 pushups.",
  "Stretch your arms for 2 minutes.",
  "Close your eyes and breathe deeply.",
  "Do 15 jumping jacks.",
  "Look at something 20 feet away for 20 seconds.",
  "Walk around your room for a minute.",
  "Do 5 minutes of light yoga.",
  "Refill your water bottle.",
  "Wash your face with cold water.",
  "Do some shoulder rolls.",
  "Stand up and do 10 squats.",
  "Tidy up your desk for 2 minutes.",
  "Check your posture.",
  "Do 10 lunges.",
  "Rotate your wrists and ankles.",
  "Reach for your toes and hold.",
  "Do 10 mountain climbers.",
  "Grab a healthy snack.",
  "Message a friend something nice.",
  "Look out the window for a while.",
  "Do 10 neck tilts.",
  "Balance on one leg for 30 seconds.",
  "Give your eyes a screen break.",
  "Do 10 calf raises.",
  "Think about one thing you learned today.",
  "Listen to one upbeat song.",
  "Do a quick plank for 30 seconds.",
  "Dance like nobody is watching for 1 minute."
];

export const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'] as const;
export const ACADEMIC_LEVELS = ['Kindergarten', 'Elementary', 'High School', 'Undergraduate', 'Graduate', 'PhD', 'Professional'] as const;

export const SYSTEM_PROMPTS = {
  CURRICULUM: `Act as a world-class curriculum architect. Your goal is to structure a learning path that is logical, sequential, and comprehensive.
  - Break down the goal into 4-6 major phases (Level 1).
  - For each phase, provide subtopics (Level 1.1, 1.2).
  - STRICT JSON OUTPUT. No conversational text.
  - REQUIRED JSON FORMAT:
  {
    "curriculum": [
      {
        "id": "1",
        "label": "Phase Name",
        "level": "1",
        "description": "Brief overview of this phase",
        "children": [
          {
            "id": "1.1",
            "label": "Subtopic Name",
            "level": "1.1",
            "description": "What will be learned"
          }
        ]
      }
    ]
  }`,
  
  TOPIC_CORE: `You are a specialized knowledge engine.
  Task: Generate the core learning content for the provided topic.
  Format: Markdown.
  Structure:
  1. Title (H1)
  2. Short Definition (Bold)
  3. Main Explanation (Headings, bullet points, code blocks if relevant).
  
  Output ONLY JSON: { "title": "Topic Title", "definition": "1-sentence summary", "markdown": "# Title..." }`,

  DEEP_DIVE: `You are an expert professor writing a comprehensive textbook chapter.
  Task: Write an extensive, deep-dive explanation of the topic.
  Requirements:
  - Length: Very long and detailed (aim for 2000-3000 words equivalence in depth).
  - Structure: Introduction, Historical Context, Core Concepts, Technical/Theoretical Mechanics, Real-world Applications, Nuances & Edge Cases, Future Implications, Summary.
  - Content: Use analogies, code examples (if tech), math proofs (if STEM), and deep critical analysis.
  - Tone: Academic yet accessible.
  
  Output ONLY JSON: { "title": "Topic Title", "definition": "Expanded definition", "markdown": "# Title..." }`,

  ESSENTIALS: `You are a master of simplification (Feynman Technique). 
  Task: Explain the given topic in the simplest way possible, using analogies or metaphors.
  Output ONLY JSON: { "simpleExplanation": "The explanation..." }`,

  SIGNIFICANCE: `You are an industry strategist.
  Task: Explain WHY this topic matters. How is it applied in the real world? What problems does it solve?
  Output ONLY JSON: { "significance": "The reason..." }`,

  CONTEXT: `You are a historian and trivia expert.
  Task: Provide background context, history, or interesting facts about this topic.
  Output ONLY JSON: { "context": "The background story..." }`,
  
  CONNECTIONS: `Analyze the provided list of learning topics. Identify a "Missing Link" or a "Bridge Topic" that connects multiple existing topics conceptually.
  Output ONLY JSON: { "label": "New Topic Name", "description": "Why this connects the others", "relatedTopicIds": ["id1", "id2"] }`,

  QUERIES: `Act as a Search Engine Optimization (SEO) expert.
  Task: Generate 3 distinct, high-quality search queries to find the best external resources (Videos, Articles, Tutorials).
  Output ONLY JSON: { "queries": ["query 1", "query 2", "query 3"] }`
};

export const MODEL_OPTIONS = {
  gemini: [
    { id: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash (Free Preview)' },
    { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
    { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' }
  ],
  groq: [
    { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B (Free/Default)' },
    { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B (Fastest)' },
    { id: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B (Free)' },
    { id: 'gemma2-9b-it', label: 'Gemma 2 9B (Free)' }
  ],
  cerebras: [
    { id: 'llama3.1-70b', label: 'Llama 3.1 70B (Fastest)' },
    { id: 'llama3.1-8b', label: 'Llama 3.1 8B' }
  ],
  openai: [
    { id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { id: 'gpt-4o', label: 'GPT-4o' }
  ],
  openrouter: [
    { id: 'mistralai/mistral-7b-instruct:free', label: 'Mistral 7B (Free)' },
    { id: 'google/gemini-2.0-flash-exp:free', label: 'Gemini 2.0 Flash (Free)' },
    { id: 'meta-llama/llama-3.2-11b-vision-instruct:free', label: 'Llama 3.2 11B (Free)' },
    { id: 'nvidia/llama-3.1-nemotron-70b-instruct:free', label: 'Nvidia Nemotron 70B (Free)' },
    { id: 'microsoft/phi-3-mini-128k-instruct:free', label: 'Phi-3 Mini (Free)' }
  ]
};
