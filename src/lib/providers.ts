// lib/providers.ts — Multi-LLM Provider Configuration
// OpenRouter is used as the routing backend but hidden from the public UI
// Models are categorized by tier: 'free' (costs $0) or 'premium' (costs API $)

export interface ModelConfig {
  id: string;
  name: string;
  provider: ProviderId;
  description: string;
  tier: 'free' | 'premium';
  dailyLimit?: number; // Daily message limit for premium models (only enforced for PREMIUM plan)
}

export type ProviderId =
  | '_openrouter'
  | 'gpt'
  | 'claude'
  | 'gemini'
  | 'mistral'
  | 'deepseek'
  | 'grok'
  | 'llama'
  | 'qwen'
  | 'glm'
  | 'perplexity'
  | 'ollama'
  | 'custom';

export interface ProviderConfig {
  id: ProviderId;
  name: string;
  icon: string;
  models: ModelConfig[];
  envKey: string;
  baseUrl?: string;
  isCustom?: boolean;
  hidden?: boolean;
}

export const providers: ProviderConfig[] = [
  // ═══════════════════════════════════════════════════════════════
  // FREE MODELS (costs you $0 per message via OpenRouter :free)
  // ═══════════════════════════════════════════════════════════════

  {
    id: 'deepseek',
    name: 'DeepSeek',
    icon: '🔷',
    envKey: 'OPENROUTER_API_KEY',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: [
      { id: 'deepseek/deepseek-chat-v3-0324:free', name: 'DeepSeek V3', provider: 'deepseek', description: 'General-purpose, strong reasoning', tier: 'free' },
      { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1', provider: 'deepseek', description: 'Chain-of-thought reasoning', tier: 'free' },
    ],
  },
  {
    id: 'llama',
    name: 'Llama',
    icon: '🦙',
    envKey: 'OPENROUTER_API_KEY',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: [
      { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B', provider: 'llama', description: 'Meta flagship, 70B parameters', tier: 'free' },
      { id: 'meta-llama/llama-3.1-8b-instruct:free', name: 'Llama 3.1 8B', provider: 'llama', description: 'Fast & lightweight', tier: 'free' },
    ],
  },
  {
    id: 'qwen',
    name: 'Qwen',
    icon: '🐉',
    envKey: 'OPENROUTER_API_KEY',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: [
      { id: 'qwen/qwen-2.5-72b-instruct:free', name: 'Qwen 2.5 72B', provider: 'qwen', description: 'Alibaba, 72B parameters', tier: 'free' },
      { id: 'qwen/qwen-2-7b-instruct:free', name: 'Qwen 2 7B', provider: 'qwen', description: 'Fast & efficient', tier: 'free' },
    ],
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    icon: '🟣',
    envKey: 'OPENROUTER_API_KEY',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: [
      { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B', provider: 'mistral', description: 'Fast open-source model', tier: 'free' },
    ],
  },
  {
    id: 'gemini',
    name: 'Gemma',
    icon: '🔵',
    envKey: 'OPENROUTER_API_KEY',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: [
      { id: 'google/gemma-2-9b-it:free', name: 'Gemma 2 9B', provider: 'gemini', description: 'Google open-source, instruction-tuned', tier: 'free' },
    ],
  },

  // ─── More Free Models (grouped as new "providers" for the sidebar) ───

  {
    id: 'gpt',
    name: 'Phi-3',
    icon: '🟢',
    envKey: 'OPENROUTER_API_KEY',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: [
      { id: 'microsoft/phi-3-mini-128k-instruct:free', name: 'Phi-3 Mini 128K', provider: 'gpt', description: 'Microsoft, 128K context', tier: 'free' },
    ],
  },
  {
    id: 'perplexity',
    name: 'Hermes',
    icon: '🟡',
    envKey: 'OPENROUTER_API_KEY',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: [
      { id: 'nousresearch/nous-hermes-2-mixtral-8x7b-dpo:free', name: 'Hermes Mixtral 8x7B', provider: 'perplexity', description: 'Mixtral MoE, DPO tuned', tier: 'free' },
    ],
  },

  // We'll reuse 'glm' slot for Zephyr
  {
    id: 'glm',
    name: 'Zephyr',
    icon: '🔴',
    envKey: 'OPENROUTER_API_KEY',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: [
      { id: 'huggingfaceh4/zephyr-7b-beta:free', name: 'Zephyr 7B', provider: 'glm', description: 'HuggingFace, chat fine-tuned', tier: 'free' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // PREMIUM MODELS (costs API $$ — only for PREMIUM subscribers)
  // ═══════════════════════════════════════════════════════════════

  {
    id: '_openrouter',
    name: 'GPT-4o',
    icon: '🟢',
    envKey: 'OPENROUTER_API_KEY',
    baseUrl: 'https://openrouter.ai/api/v1',
    hidden: true,
    models: [
      { id: 'openai/gpt-4o', name: 'GPT-4o', provider: '_openrouter', description: 'Most capable, multimodal', tier: 'premium', dailyLimit: 10 },
      { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: '_openrouter', description: 'Fast & affordable', tier: 'premium', dailyLimit: 25 },
    ],
  },
  {
    id: 'claude',
    name: 'Claude',
    icon: '🟠',
    envKey: 'OPENROUTER_API_KEY',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: [
      { id: 'anthropic/claude-sonnet-4-20250514', name: 'Claude 4 Sonnet', provider: 'claude', description: 'Best balance of speed & intelligence', tier: 'premium', dailyLimit: 10 },
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'claude', description: 'Strong reasoning, fast', tier: 'premium', dailyLimit: 15 },
      { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus', provider: 'claude', description: 'Most powerful, complex tasks', tier: 'premium', dailyLimit: 5 },
    ],
  },
  {
    id: 'grok',
    name: 'Grok',
    icon: '⚡',
    envKey: 'OPENROUTER_API_KEY',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: [
      { id: 'x-ai/grok-3-beta', name: 'Grok 3', provider: 'grok', description: 'xAI Grok 3', tier: 'premium', dailyLimit: 10 },
    ],
  },

  // ─── Hidden / Internal providers (not shown in sidebar) ───

  {
    id: 'ollama',
    name: 'Ollama (Local)',
    icon: '🟤',
    envKey: 'OLLAMA_BASE_URL',
    baseUrl: 'http://localhost:11434/v1',
    hidden: true,
    models: [
      { id: 'llama3', name: 'Llama 3', provider: 'ollama', description: 'Meta Llama 3 (local)', tier: 'free' },
      { id: 'mistral', name: 'Mistral (local)', provider: 'ollama', description: 'Mistral 7B (local)', tier: 'free' },
    ],
  },
  {
    id: 'custom',
    name: 'Custom Endpoint',
    icon: '⚙️',
    envKey: 'CUSTOM_API_KEY',
    baseUrl: '',
    isCustom: true,
    hidden: true,
    models: [
      { id: 'custom-model', name: 'Custom Model', provider: 'custom', description: 'Any OpenAI-compatible endpoint', tier: 'free' },
    ],
  },
];

// ─── Public providers (shown in sidebar) ───
export const publicProviders = providers.filter(
  (p) => !p.hidden && p.id !== 'ollama' && p.id !== 'custom'
);

// ─── Free models only (for trial and PRO users) ───
export const freeModels = providers
  .flatMap((p) => p.models)
  .filter((m) => m.tier === 'free');

// ─── Premium models only ───
export const premiumModels = providers
  .flatMap((p) => p.models)
  .filter((m) => m.tier === 'premium');

// ─── Check if a model is free ───
export function isModelFree(modelId: string): boolean {
  return providers
    .flatMap((p) => p.models)
    .some((m) => m.id === modelId && m.tier === 'free');
}

// ─── Get a specific provider by ID ───
export function getProvider(id: ProviderId): ProviderConfig | undefined {
  return providers.find((p) => p.id === id);
}

// ─── Get models for a specific provider ───
export function getModelsForProvider(id: ProviderId): ModelConfig[] {
  return getProvider(id)?.models ?? [];
}

// ─── Check if a provider routes through OpenRouter ───
export function isOpenRouterBacked(providerId: ProviderId): boolean {
  const p = getProvider(providerId);
  return p?.baseUrl === 'https://openrouter.ai/api/v1';
}