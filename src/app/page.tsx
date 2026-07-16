// app/page.tsx — Full Multi-LLM Chat UI (AI SDK v7)
'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useState, useRef, useEffect, useCallback } from 'react';
import { publicProviders, providers, type ProviderId } from '@/lib/providers';
import { UserButton, SignInButton, SignUpButton, useUser } from '@clerk/nextjs';

function extractText(message: { parts?: Array<{ type: string; text?: string }> }): string {
  if (!message.parts) return '';
  return message.parts
    .filter((p) => p.type === 'text')
    .map((p) => p.text || '')
    .join('');
}

function SettingsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [keys, setKeys] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem('ai-aggregator-keys') || '{}';
      setKeys(JSON.parse(stored));
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('ai-aggregator-keys', JSON.stringify(keys));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1a2e] rounded-2xl border border-gray-700 w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-1">API Keys</h2>
          <p className="text-gray-400 text-sm mb-5">
            Keys are stored locally in your browser. Never sent to any server except the respective LLM provider.
          </p>

          <div className="space-y-3">
            {providers.map((p) => (
              <div key={p.id}>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  {p.icon} {p.name}{' '}
                  <span className="text-gray-500 text-xs">
                    ({p.id === 'ollama' ? 'Base URL' : 'API Key'})
                  </span>
                </label>
                <input
                  type="password"
                  className="w-full px-3 py-2 bg-[#0d0d1a] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder={
                    p.id === 'ollama'
                      ? 'http://localhost:11434/v1'
                      : p.id === 'custom'
                        ? 'Enter base URL for custom endpoint'
                        : `sk-... or ${p.envKey}`
                  }
                  value={keys[p.envKey] || ''}
                  onChange={(e) => setKeys({ ...keys, [p.envKey]: e.target.value })}
                />
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
            >
              Save Keys
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NewChatButton({ onNewChat }: { onNewChat: () => void }) {
  return (
    <button
      onClick={onNewChat}
      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white transition-all text-sm w-full"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      New Chat
    </button>
  );
}

export default function Chat() {
  const { isSignedIn, isLoaded } = useUser();
  const [input, setInput] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<ProviderId>('deepseek');
  const [selectedModel, setSelectedModel] = useState<string>('deepseek/deepseek-chat-v3-0324');
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [credits, setCredits] = useState<number | null>(null);
  const [plan, setPlan] = useState<string>('FREE');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch credits on mount and after each message
  const fetchCredits = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const res = await fetch('/api/credits');
      if (res.ok) {
        const data = await res.json();
        setCredits(data.credits);
        setPlan(data.plan);
      }
    } catch {}
  }, [isSignedIn]);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  // Use refs so the transport always reads the latest provider/model
  const providerModelRef = useRef({ provider: selectedProvider, model: selectedModel });
  providerModelRef.current = { provider: selectedProvider, model: selectedModel };

  // Create transport once, body function reads latest values from ref
  const transportRef = useRef(
    new DefaultChatTransport({
      api: '/api/chat',
      body: () => providerModelRef.current,
    })
  );

  const currentProvider = publicProviders.find((p) => p.id === selectedProvider) || providers.find((p) => p.id === selectedProvider)!;
  const currentModels = currentProvider?.models || [];

  const { messages, status, error, setMessages, sendMessage, stop } = useChat({
    transport: transportRef.current,
    onError: (err) => {
      console.error('Chat error:', err);
    },
  });

  const isLoading = status === 'submitted' || status === 'streaming';

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
    // Refresh credits after each new assistant message
    if (messages.length > 0 && messages[messages.length - 1]?.role === 'assistant') {
      fetchCredits();
    }
  }, [messages, scrollToBottom, fetchCredits]);

  const handleProviderChange = (providerId: ProviderId) => {
    const provider = publicProviders.find((p) => p.id === providerId) || providers.find((p) => p.id === providerId);
    setSelectedProvider(providerId);
    if (provider && provider.models.length > 0) {
      setSelectedModel(provider.models[0].id);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-screen bg-[#0a0a0f] text-white">
      {/* Sidebar */}
      {sidebarOpen && (
        <aside className="w-72 bg-[#0d0d1a] border-r border-gray-800 flex flex-col shrink-0">
          <div className="p-4 border-b border-gray-800 flex items-center gap-3">
            <img src="/logo.png" alt="AI Aggregator" className="w-9 h-9 rounded-lg" />
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                AI Aggregator
              </h1>
              <p className="text-xs text-gray-500">Multi-LLM Chat Agent</p>
            </div>
          </div>

          <div className="p-3">
            <NewChatButton onNewChat={handleNewChat} />
          </div>

          {/* Provider List */}
          <nav className="flex-1 overflow-y-auto px-3 pb-3">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold px-2 mb-2">
              AI Models
            </p>
            <div className="space-y-0.5">
              {publicProviders.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleProviderChange(p.id)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all text-left ${
                    selectedProvider === p.id
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                      : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200 border border-transparent'
                  }`}
                >
                  <span className="text-base">{p.icon}</span>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{p.name}</div>
                    <div className="text-[10px] text-gray-500">{p.models.length} models</div>
                  </div>
                </button>
              ))}
            </div>
          </nav>

          {/* Credit Counter & Upgrade */}
          <div className="p-3 border-t border-gray-800">
            {isSignedIn ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">
                    {plan === 'PRO' ? '∞' : credits !== null ? credits : '...'} credits
                  </span>
                  {plan !== 'PRO' && (
                    <a href="/pricing" className="text-blue-400 hover:text-blue-300 text-xs font-medium">
                      Upgrade
                    </a>
                  )}
                </div>
                {plan !== 'PRO' && credits !== null && (
                  <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${credits > 5 ? 'bg-blue-500' : credits > 0 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(100, (credits / 10) * 100)}%` }}
                    />
                  </div>
                )}
                {plan === 'PRO' && (
                  <span className="text-[10px] text-green-400 font-medium">PRO — Unlimited</span>
                )}
              </div>
            ) : (
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-2">Sign up for 10 free credits</p>
                <SignUpButton mode="modal">
                  <button className="w-full py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors font-medium">
                    Create Free Account
                  </button>
                </SignUpButton>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-14 border-b border-gray-800 flex items-center justify-between px-4 bg-[#0d0d1a]/50 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Model Selector */}
            <div className="flex items-center gap-2">
              <span className="text-base">{currentProvider?.icon}</span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-[#1a1a2e] border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
              >
                {currentModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-gray-500 hidden sm:inline">
                {currentModels.find((m) => m.id === selectedModel)?.description}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isLoading && (
              <button
                onClick={stop}
                className="p-2 rounded-lg hover:bg-gray-800 text-red-400 transition-colors"
                title="Stop generating"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="1" />
                </svg>
              </button>
            )}
            {isLoaded && (
              isSignedIn ? (
                <UserButton />
              ) : (
                <div className="flex items-center gap-2">
                  <SignInButton mode="modal">
                    <button className="px-3 py-1.5 text-sm text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-gray-800">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                      Sign Up
                    </button>
                  </SignUpButton>
                </div>
              )
            )}
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-center">
                <div className="text-6xl mb-4">{currentProvider?.icon}</div>
                <h2 className="text-2xl font-bold text-white mb-2">AI Aggregator</h2>
                <p className="text-gray-400 mb-6 max-w-md">
                  Chat with {currentProvider?.name}&apos;s{' '}
                  <span className="text-blue-400 font-medium">
                    {currentModels.find((m) => m.id === selectedModel)?.name}
                  </span>
                </p>
                <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
                  {[
                    'Explain quantum computing',
                    'Write a Python function',
                    'Compare React vs Vue',
                    'Summarize a topic',
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setInput(suggestion)}
                      className="text-left px-4 py-3 bg-[#1a1a2e] border border-gray-800 rounded-xl text-sm text-gray-300 hover:bg-[#1f1f35] hover:border-gray-700 transition-all"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => {
              const text = extractText(m);
              if (!text) return null;
              return (
                <div
                  key={m.id}
                  className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${
                        m.role === 'user'
                          ? 'bg-blue-600'
                          : 'bg-gradient-to-br from-purple-500 to-blue-500'
                      }`}
                    >
                      {m.role === 'user' ? 'U' : currentProvider?.icon}
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        m.role === 'user'
                          ? 'bg-blue-600 text-white rounded-tr-md'
                          : 'bg-[#1a1a2e] text-gray-200 border border-gray-800 rounded-tl-md'
                      }`}
                    >
                      {m.role === 'assistant' ? (
                        <div className="prose prose-invert prose-sm max-w-none prose-pre:bg-[#0d0d1a] prose-pre:border prose-pre:border-gray-800 prose-code:text-blue-400 prose-a:text-blue-400">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {text}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{text}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {isLoading && messages.length > 0 && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex justify-start w-full">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-sm shrink-0">
                    {currentProvider?.icon}
                  </div>
                  <div className="bg-[#1a1a2e] border border-gray-800 rounded-2xl rounded-tl-md px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                      <span className="text-xs text-gray-500 ml-2">Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="flex justify-center w-full">
                <div className="bg-red-900/30 border border-red-800 rounded-xl px-4 py-3 text-red-400 text-sm max-w-lg">
                  <strong>Error:</strong> {error.message || 'Something went wrong.'}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-800 p-4 bg-[#0d0d1a]/50 backdrop-blur-sm shrink-0">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-2 items-end">
              <div className="flex-1 relative">
                <textarea
                  className="w-full px-4 py-3 bg-[#1a1a2e] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none placeholder-gray-500"
                  value={input}
                  placeholder={`Message ${currentModels.find((m) => m.id === selectedModel)?.name || '...'}...`}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  style={{ minHeight: '46px', maxHeight: '200px' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, 200) + 'px';
                  }}
                />
              </div>
              <button
                type="button"
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="p-3 bg-blue-600 rounded-xl text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </div>
            <p className="text-[10px] text-gray-600 mt-2 text-center">
              {currentProvider?.name} &middot; {currentModels.find((m) => m.id === selectedModel)?.name} &middot; Responses may be inaccurate
            </p>
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}