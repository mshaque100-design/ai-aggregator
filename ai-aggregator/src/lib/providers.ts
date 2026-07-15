// lib/providers.ts — Multi-LLM Provider Configuration

export interface ModelConfig {
  id: string;
  name: string;
  provider: ProviderId;
  description: string;
  maxTokens?: number;
}

export type ProviderId =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'mistral'
  | 'deepseek'
  | 'glm'
  | 'ollama'
  | 'perplexity'
  | 'custom';

export interface ProviderConfig {
  id: ProviderId;
  name: string;
  icon: string;
  models: ModelConfig[];
  envKey: string;
  baseUrl?: string;
  isCustom?: boolean;
}

export const providers: ProviderConfig[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    icon: '🟢',
    envKey: 'OPENAI_API_KEY',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', description: 'Most capable, multimodal' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', description: 'Fast & affordable' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai', description: 'Previous flagship' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai', description: 'Fast & cheap' },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    icon: '🟠',
    envKey: 'ANTHROPIC_API_KEY',
    models: [
      { id: 'claude-sonnet-4-20250514', name: 'Claude 4 Sonnet', provider: 'anthropic', description: 'Best balance of speed & intelligence' },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'anthropic', description: 'Strong reasoning, fast' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'anthropic', description: 'Most powerful, complex tasks' },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', provider: 'anthropic', description: 'Fastest, most compact' },
    ],
  },
  {
    id: 'google',
    name: 'Google',
    icon: '🔵',
    envKey: 'GOOGLE_GENERATIVE_AI_API_KEY',
    models: [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'google', description: 'Fast, thinking model' },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'google', description: 'Most capable Gemini' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'google', description: 'Fast & efficient' },
    ],
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    icon: '🟣',
    envKey: 'MISTRAL_API_KEY',
    models: [
      { id: 'mistral-large-latest', name: 'Mistral Large', provider: 'mistral', description: 'Most capable Mistral model' },
      { id: 'mistral-medium-latest', name: 'Mistral Medium', provider: 'mistral', description: 'Balanced performance' },
      { id: 'codestral-latest', name: 'Codestral', provider: 'mistral', description: 'Optimized for code' },
      { id: 'open-mistral-nemo', name: 'Mistral Nemo', provider: 'mistral', description: 'Open weights, compact' },
    ],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    icon: '🔷',
    envKey: 'DEEPSEEK_API_KEY',
    baseUrl: 'https://api.deepseek.com/v1',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat (V3)', provider: 'deepseek', description: 'General-purpose, strong reasoning' },
      { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner (R1)', provider: 'deepseek', description: 'Chain-of-thought reasoning' },
      { id: 'deepseek-coder', name: 'DeepSeek Coder', provider: 'deepseek', description: 'Code-specialized' },
    ],
  },
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