// lib/providers.ts — Multi-LLM Provider Configuration
// OpenRouter is used as the routing backend but hidden from the public UI

export interface ModelConfig {
  id: string;
  name: string;
  provider: ProviderId;
  description: string;
  maxTokens?: number;
}

export type ProviderId =
  | '_openrouter'
  | 'gpt'
  | 'claude'
  | 'gemini'
  | 'mistral'
  | 'deepseek'
  | 'glm'
  | 'ollama'
  | 'perplexity'
  | 'grok'
  | 'llama'
  | 'qwen'
  | 'custom';

export interface ProviderConfig {
  id: ProviderId;
  name: string;
  icon: string;
  models: ModelConfig[];
  envKey: string;
  baseUrl?: string;
  isCustom?: boolean;
  hidden?: boolean; // true = not shown in sidebar
}

export const providers: ProviderConfig[] = [
  // ─── Branded model providers (routed through OpenRouter, shown to public) ───

  {
    id: 'gpt',
    name: 'GPT',
    icon: '🟢',
    envKey: 'OPENROUTER_API_KEY',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: [
      { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'gpt', description: 'Most capable, multimodal' },
      { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'gpt', description: 'Fast & affordable' },
    ],
  },
  {
    id: 'claude',
    name: 'Claude',
    icon: '🟠',
    envKey: 'OPENROUTER_API_KEY',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: [
      { id: 'anthropic/claude-sonnet-4-20250514', name: 'Claude 4 Sonnet', provider: 'claude', description: 'Best balance of speed & intelligence' },
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'claude', description: 'Strong reasoning, fast' },
      { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus', provider: 'claude', description: 'Most powerful, complex tasks' },
    ],
  },
  {
    id: 'gemini',
    name: 'Gemini',
    icon: '🔵',
    envKey: 'OPENROUTER_API_KEY',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: [
      { id: 'google/gemini-2.5-flash-preview', name: 'Gemini 2.5 Flash', provider: 'gemini', description: 'Fast, thinking model' },
      { id: 'google/gemini-2.5-pro-preview', name: 'Gemini 2.5 Pro', provider: 'gemini', description: 'Most capable Gemini' },
    ],
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    icon: '🟣',
    envKey: 'OPENROUTER_API_KEY',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: [
      { id: 'mistralai/mistral-large', name: 'Mistral Large', provider: 'mistral', description: 'Most capable Mistral model' },
    ],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    icon: '🔷',
    envKey: 'OPENROUTER_API_KEY',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: [
      { id: 'deepseek/deepseek-chat-v3-0324', name: 'DeepSeek V3', provider: 'deepseek', description: 'General-purpose, strong reasoning' },
      { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', provider: 'deepseek', description: 'Chain-of-thought reasoning' },
    ],
  },
  {
    id: 'grok',
    name: 'Grok',
    icon: '⚡',
    envKey: 'OPENROUTER_API_KEY',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: [
      { id: 'x-ai/grok-3-beta', name: 'Grok 3', provider: 'grok', description: 'xAI Grok 3' },
    ],
  },
  {
    id: 'llama',
    name: 'Llama 3.3 70B',
    icon: '🦙',
    envKey: 'OPENROUTER_API_KEY',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: [
      { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B Instruct', provider: 'llama', description: 'Meta open source flagship' },
    ],
  },
  {
    id: 'qwen',
    name: 'Qwen3',
    icon: '🐉',
    envKey: 'OPENROUTER_API_KEY',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: [
      { id: 'qwen/qwen3-235b-a22b', name: 'Qwen3 235B', provider: 'qwen', description: 'Alibaba MoE, 235B parameters' },
    ],
  },

  // ─── Direct API providers (require own API keys) ───

  {
    id: 'glm',
    name: 'Zhipu GLM',
    icon: '🔴',
    envKey: 'GLM_API_KEY',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4/',
    models: [
      { id: 'glm-4-turbo', name: 'GLM-4 Turbo', provider: 'glm', description: 'Fast, capable, affordable' },
      { id: 'glm-4-plus', name: 'GLM-4 Plus', provider: 'glm', description: 'Enhanced reasoning' },
      { id: 'glm-4-flash', name: 'GLM-4 Flash', provider: 'glm', description: 'Fastest, cheapest' },
      { id: 'glm-4-long', name: 'GLM-4 Long', provider: 'glm', description: '128K context window' },
    ],
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    icon: '🟡',
    envKey: 'PERPLEXITY_API_KEY',
    baseUrl: 'https://api.perplexity.ai',
    models: [
      { id: 'sonar-pro', name: 'Sonar Pro', provider: 'perplexity', description: 'Search-grounded, most capable' },
      { id: 'sonar', name: 'Sonar', provider: 'perplexity', description: 'Search-grounded, fast' },
    ],
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    icon: '🟤',
    envKey: 'OLLAMA_BASE_URL',
    baseUrl: 'http://localhost:11434/v1',
    models: [
      { id: 'llama3', name: 'Llama 3', provider: 'ollama', description: 'Meta Llama 3 (local)' },
      { id: 'mistral', name: 'Mistral (local)', provider: 'ollama', description: 'Mistral 7B (local)' },
      { id: 'codellama', name: 'Code Llama', provider: 'ollama', description: 'Code Llama (local)' },
      { id: 'phi3', name: 'Phi-3', provider: 'ollama', description: 'Microsoft Phi-3 (local)' },
    ],
  },
  {
    id: 'custom',
    name: 'Custom Endpoint',
    icon: '⚙️',
    envKey: 'CUSTOM_API_KEY',
    baseUrl: '',
    isCustom: true,
    models: [
      { id: 'custom-model', name: 'Custom Model', provider: 'custom', description: 'Any OpenAI-compatible endpoint' },
    ],
  },
];

// Public-facing providers only (hides OpenRouter, Ollama, Custom from public)
export const publicProviders = providers.filter(
  (p) => !p.hidden && p.id !== 'ollama' && p.id !== 'custom'
);

// Get all models as a flat list
export function getAllModels(): ModelConfig[] {
  return providers.flatMap((p) => p.models);
}

// Get a specific provider by ID
export function getProvider(id: ProviderId): ProviderConfig | undefined {
  return providers.find((p) => p.id === id);
}

// Get models for a specific provider
export function getModelsForProvider(id: ProviderId): ModelConfig[] {
  return getProvider(id)?.models ?? [];
}

// Check if a provider routes through OpenRouter (for API routing)
export function isOpenRouterBacked(providerId: ProviderId): boolean {
  const p = getProvider(providerId);
  return p?.baseUrl === 'https://openrouter.ai/api/v1';
}