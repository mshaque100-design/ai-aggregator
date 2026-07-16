// app/api/chat/route.ts — Unified Multi-Provider Chat Route
import { streamText, createUIMessageStreamResponse, toUIMessageStream } from 'ai';
import type { LanguageModel } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { providers, isOpenRouterBacked, type ProviderId } from '@/lib/providers';

const SYSTEM_PROMPT = `You are a helpful AI assistant. Be concise, accurate, and friendly.
If you don't know something, say so honestly. Format code blocks when sharing code.`;

// Create OpenRouter client (reused for all OpenRouter-backed providers)
function createOpenRouterClient() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('API key not configured. Please contact support.');
  return createOpenAI({
    apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
    headers: {
      'HTTP-Referer': 'https://ai-aggregator.app',
      'X-Title': 'AI Aggregator',
    },
  });
}

function getModel(providerId: ProviderId, modelId: string): LanguageModel {
  const provider = providers.find((p) => p.id === providerId);
  if (!provider) throw new Error(`Unknown provider: ${providerId}`);

  // All OpenRouter-backed providers (GPT, Claude, Gemini, Mistral, DeepSeek, Grok, Llama, Qwen)
  if (isOpenRouterBacked(providerId)) {
    const client = createOpenRouterClient();
    return client.chat(modelId);
  }

  // Direct API providers
  switch (providerId) {
    case 'glm': {
      const apiKey = process.env.GLM_API_KEY;
      if (!apiKey) throw new Error('GLM_API_KEY not set');
      const glm = createOpenAI({
        apiKey,
        baseURL: process.env.GLM_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4/',
      });
      return glm.chat(modelId);
    }

    case 'perplexity': {
      const apiKey = process.env.PERPLEXITY_API_KEY;
      if (!apiKey) throw new Error('PERPLEXITY_API_KEY not set');
      const perplexity = createOpenAI({
        apiKey,
        baseURL: 'https://api.perplexity.ai',
      });
      return perplexity.chat(modelId);
    }

    case 'ollama': {
      const baseURL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1';
      const ollama = createOpenAI({
        apiKey: 'ollama',
        baseURL,
      });
      return ollama.chat(modelId);
    }

    case 'custom': {
      const apiKey = process.env.CUSTOM_API_KEY || '';
      const baseURL = process.env.CUSTOM_BASE_URL || '';
      if (!baseURL) throw new Error('CUSTOM_BASE_URL not set');
      const custom = createOpenAI({ apiKey, baseURL });
      return custom.chat(modelId);
    }

    default:
      throw new Error(`Unsupported provider: ${providerId}`);
  }
}

// Convert UIMessage (v7 format with parts) to core messages for streamText
function toCoreMessages(uiMessages: Array<{ role: string; parts?: Array<{ type: string; text?: string }> }>) {
  return uiMessages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: (m.parts || [])
        .filter((p) => p.type === 'text')
        .map((p) => p.text || '')
        .join(''),
    }));
}

export async function POST(req: Request) {
  const { messages, provider: providerId, model: modelId } = await req.json();

  if (!providerId || !modelId) {
    return new Response(JSON.stringify({ error: 'Provider and model are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const model = getModel(providerId, modelId);
    const coreMessages = toCoreMessages(messages);

    const result = streamText({
      model,
      system: SYSTEM_PROMPT,
      messages: coreMessages,
      maxOutputTokens: 4096,
    });

    return createUIMessageStreamResponse({
      stream: toUIMessageStream({ stream: result.fullStream }),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}