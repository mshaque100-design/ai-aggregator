// app/api/chat/route.ts — Multi-Provider Chat Route with Plan Enforcement
import { streamText, createUIMessageStreamResponse, toUIMessageStream } from 'ai';
import type { LanguageModel } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { providers, isOpenRouterBacked, isModelFree, type ProviderId } from '@/lib/providers';

const SYSTEM_PROMPT = `You are a helpful AI assistant. Be concise, accurate, and friendly.
If you don't know something, say so honestly. Format code blocks when sharing code.`;

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

  if (isOpenRouterBacked(providerId)) {
    return createOpenRouterClient().chat(modelId);
  }

  switch (providerId) {
    case 'ollama': {
      return createOpenAI({ apiKey: 'ollama', baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1' }).chat(modelId);
    }
    case 'custom': {
      const apiKey = process.env.CUSTOM_API_KEY || '';
      const baseURL = process.env.CUSTOM_BASE_URL || '';
      if (!baseURL) throw new Error('CUSTOM_BASE_URL not set');
      return createOpenAI({ apiKey, baseURL }).chat(modelId);
    }
    default:
      throw new Error(`Unsupported provider: ${providerId}`);
  }
}

function toCoreMessages(uiMessages: Array<{ role: string; parts?: Array<{ type: string; text?: string }> }>) {
  return uiMessages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: (m.parts || []).filter((p) => p.type === 'text').map((p) => p.text || '').join(''),
    }));
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'
}

function getModelDailyLimit(modelId: string): number | null {
  const allModels = providers.flatMap((p) => p.models);
  const model = allModels.find((m) => m.id === modelId);
  return model?.dailyLimit ?? null;
}

export async function POST(req: Request) {
  const { messages, provider: providerId, model: modelId } = await req.json();

  if (!providerId || !modelId) {
    return new Response(JSON.stringify({ error: 'Provider and model are required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { userId } = await auth();
    const prisma = await db();

    // ─── Access Control (only if DB + auth available) ───
    if (userId && prisma) {
      // Upsert user on first message
      await prisma.user.upsert({
        where: { id: userId },
        create: {
          id: userId,
          email: '',
          plan: 'TRIAL',
          trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        },
        update: {},
      });

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error('User not found');

      const modelIsFree = isModelFree(modelId);

      // ─── TRIAL user checks ───
      if (user.plan === 'TRIAL') {
        // Check if trial has expired
        if (user.trialEndsAt && new Date() > user.trialEndsAt) {
          return new Response(
            JSON.stringify({
              error: 'Your 7-day free trial has ended. Upgrade to continue chatting.',
              code: 'TRIAL_EXPIRED',
            }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
        // Trial users can only use FREE models
        if (!modelIsFree) {
          return new Response(
            JSON.stringify({
              error: 'This model is for Premium subscribers only. Upgrade to unlock all models.',
              code: 'UPGRADE_REQUIRED',
            }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }

      // ─── PRO user checks (free models unlimited, premium models blocked) ───
      if (user.plan === 'PRO') {
        if (!modelIsFree) {
          return new Response(
            JSON.stringify({
              error: 'This model requires a Premium plan. Upgrade to unlock GPT-4o, Claude, and Grok.',
              code: 'UPGRADE_REQUIRED',
            }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }

      // ─── PREMIUM user checks (all models, with daily limits on premium models) ───
      if (user.plan === 'PREMIUM' && !modelIsFree) {
        const dailyLimit = getModelDailyLimit(modelId);
        if (dailyLimit !== null) {
          const today = getTodayString();
          const usage = await prisma.dailyUsage.findUnique({
            where: { userId_model_date: { userId, model: modelId, date: today } },
          });
          if (usage && usage.count >= dailyLimit) {
            return new Response(
              JSON.stringify({
                error: `Daily limit reached (${dailyLimit} messages/day for this model). Try again tomorrow or use a free model.`,
                code: 'DAILY_LIMIT',
              }),
              { status: 429, headers: { 'Content-Type': 'application/json' } }
            );
          }
        }
      }

      // ─── Track usage (increment daily counter) ───
      if (user.plan === 'PREMIUM' && !modelIsFree) {
        const today = getTodayString();
        await prisma.dailyUsage.upsert({
          where: { userId_model_date: { userId, model: modelId, date: today } },
          create: { userId, model: modelId, date: today, count: 1 },
          update: { count: { increment: 1 } },
        });
      }
    }

    // ─── Stream the response ───
    const model = getModel(providerId, modelId);
    const coreMessages = toCoreMessages(messages);
    const result = streamText({ model, system: SYSTEM_PROMPT, messages: coreMessages, maxOutputTokens: 4096 });

    return createUIMessageStreamResponse({ stream: toUIMessageStream({ stream: result.fullStream }) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}