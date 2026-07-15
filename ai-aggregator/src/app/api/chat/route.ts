// app/api/chat/route.ts
import { pipeTextStreamToResponse } from 'ai';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.GLM_API_KEY,
  baseURL: process.env.GLM_BASE_URL, // Pointing to GLM
});

// Static System Prompt (Cached by provider)
const SYSTEM_PROMPT = `
<system_role>
You are an efficient AI aggregator agent. Your job is to route requests or answer directly.
</system_role>

<rules>
1. If the user asks for real-time info, use the web_search tool.
2. Otherwise, answer concisely.
3. Do not expose internal reasoning.
</rules>
`;

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Call GLM Turbo
  const response = await openai.chat.completions.create({
    model: 'glm-4-turbo', // or glm-4-flash for faster/cheaper routing
    stream: true,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages
    ],
  });

  // Convert the response into a friendly text stream (AI SDK v7)
  return pipeTextStreamToResponse(response.body!);
}