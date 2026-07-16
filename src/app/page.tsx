// app/page.tsx — Full Multi-LLM Chat UI with Plan Enforcement
'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useState, useRef, useEffect, useCallback } from 'react';
import { publicProviders, providers, type ProviderId, type ModelConfig, isModelFree } from '@/lib/providers';
import { UserButton, SignInButton, SignUpButton, useUser } from '@clerk/nextjs';

type UserPlan = 'GUEST' | 'TRIAL' | 'PRO' | 'PREMIUM';

function extractText(message: { parts?: Array<{ type: string; text?: string }> }): string {
  if (!message.parts) return '';
  return message.parts
    .filter((p) => p.type === 'text')
    .map((p) => p.text || '')
    .join('');
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

function LockIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
    </svg>
  );
}

export default function Chat() {
  const { isSignedIn, isLoaded } = useUser();
  const [input, setInput] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<ProviderId>('deepseek');
  const [selectedModel, setSelectedModel] = useState<string>('deepseek/deepseek-chat-v3-0324:free');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userPlan, setUserPlan] = useState<UserPlan>('GUEST');
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [trialExpired, setTrialExpired] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  // Fetch plan info
  const fetchPlan = useCallback(async () => {
    if (!isSignedIn) {
      setUserPlan('GUEST');
      setTrialDaysLeft(null);
      return;
    }
    try {
      const res = await fetch('/api/credits', { method: 'POST' }); // ensure user exists
      const data = await res.json();
      setUserPlan(data.plan || 'TRIAL');
      if (data.trialDaysLeft !== null && data.trialDaysLeft !== undefined) {
        setTrialDaysLeft(data.trialDaysLeft);
        setTrialExpired(data.trialDaysLeft <= 0);
      }
    } catch {}
  }, [isSignedIn]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  // Transport with refs
  const providerModelRef = useRef({ provider: selectedProvider, model: selectedModel });
  providerModelRef.current = { provider: selectedProvider, model: selectedModel };

  const transportRef = useRef(
    new DefaultChatTransport({
      api: '/api/chat',
      body: () => providerModelRef.current,
    })
  );

  const currentProvider = publicProviders.find((p) => p.id === selectedProvider) || providers.find((p) => p.id === selectedProvider)!;
  const currentModels = currentProvider?.models || [];
  const selectedModelConfig = currentModels.find((m) => m.id === selectedModel);
  const currentModelIsPremium = selectedModelConfig ? !isModelFree(selectedModelConfig.id) : false;

  const { messages, status, error, setMessages, sendMessage, stop } = useChat({
    transport: transportRef.current,
    onError: (err) => {
      console.error('Chat error:', err);
      // Try to parse error code from message
      try {
        const parsed = JSON.parse(err.message);
        if (parsed.code) setErrorCode(parsed.code);
      } catch {}
    },
  });

  const isLoading = status === 'submitted' || status === 'streaming';

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Clear error code when sending new message
  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    setErrorCode(null);
    sendMessage({ text: input });
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleProviderChange = (providerId: ProviderId) => {
    const provider = publicProviders.find((p) => p.id === providerId) || providers.find((p) => p.id === providerId);
    setSelectedProvider(providerId);
    if (provider && provider.models.length > 0) {
      setSelectedModel(provider.models[0].id);
    }
    setErrorCode(null);
  };

  const handleNewChat = () => {
    setMessages([]);
    setErrorCode(null);
  };

  const canUseModel = (model: ModelConfig): boolean => {
    if (model.tier === 'free') return true;
    return userPlan === 'PREMIUM';
  };

  // Error banner content
  const getErrorBanner = () => {
    if (!errorCode) return null;
    if (errorCode === 'TRIAL_EXPIRED') {
      return {
        title: 'Free Trial Ended',
        message: 'Upgrade to continue chatting with AI models.',
        cta: 'Upgrade Now',
        href: '/pricing',
      };
    }
    if (errorCode === 'UPGRADE_REQUIRED') {
      return {
        title: 'Premium Model',
        message: 'This model requires a Premium plan ($49/year).',
        cta: 'Upgrade to Premium',
        href: '/pricing',
      };
    }
    if (errorCode === 'DAILY_LIMIT') {
      return {
        title: 'Daily Limit Reached',
        message: 'Try a free model or come back tomorrow.',
        cta: null,
        href: null,
      };
    }
    return null;
  };

  const errorBanner = getErrorBanner();

  return (
    <div className="flex h-screen bg-[#0a0a0f] text-white">
      {/* ═══════════ Sidebar ═══════════ */}
      {sidebarOpen && (
        <aside className="w-72 bg-[#0d0d1a] border-r border-gray-800 flex flex-col shrink-0">
          {/* Logo */}
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
              Free Models
            </p>
            <div className="space-y-0.5">
              {publicProviders.map((p) => {
                const hasPremiumOnly = p.models.every((m) => m.tier === 'premium');
                const isLocked = hasPremiumOnly && userPlan !== 'PREMIUM';
                return (
                  <button
                    key={p.id}
                    onClick={() => !isLocked && handleProviderChange(p.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all text-left ${
                      isLocked
                        ? 'text-gray-600 cursor-not-allowed opacity-50'
                        : selectedProvider === p.id
                          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                          : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200 border border-transparent'
                    }`}
                  >
                    <span className="text-base">{p.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate flex items-center gap-1.5">
                        {p.name}
                        {isLocked && <LockIcon />}
                      </div>
                      <div className="text-[10px] text-gray-500">{p.models.length} model{p.models.length > 1 ? 's' : ''}</div>
                    </div>
                    {!isLocked && p.models.some((m) => m.tier === 'premium') && p.models.some((m) => m.tier === 'free') && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-medium shrink-0">
                        PRO
                      </span>
                    )}
                    {!isLocked && hasPremiumOnly && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-medium shrink-0">
                        PREMIUM
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Plan Status & Upgrade */}
          <div className="p-3 border-t border-gray-800">
            {isSignedIn ? (
              <div className="space-y-2">
                {/* Trial countdown */}
                {userPlan === 'TRIAL' && trialDaysLeft !== null && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-yellow-400 font-medium">
                      {trialExpired ? 'Trial expired' : `${trialDaysLeft} day${trialDaysLeft !== 1 ? 's' : ''} left`}
                    </span>
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300 font-bold">TRIAL</span>
                  </div>
                )}
                {!trialExpired && userPlan === 'TRIAL' && trialDaysLeft !== null && (
                  <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${trialDaysLeft > 3 ? 'bg-green-500' : trialDaysLeft > 1 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${(trialDaysLeft / 7) * 100}%` }}
                    />
                  </div>
                )}

                {userPlan === 'PRO' && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-blue-400 font-medium">Pro Member</span>
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">PRO</span>
                  </div>
                )}
                {userPlan === 'PREMIUM' && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-purple-400 font-medium">Premium Member</span>
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">PREMIUM</span>
                  </div>
                )}

                {(userPlan === 'TRIAL' || userPlan === 'PRO') && (
                  <a
                    href="/pricing"
                    className="block text-center w-full py-2 rounded-lg bg-blue-600 text-white text-xs hover:bg-blue-700 transition-colors font-medium"
                  >
                    {userPlan === 'TRIAL' ? 'Upgrade — From $20/yr' : 'Upgrade to Premium'}
                  </a>
                )}
              </div>
            ) : (
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-2">Sign up for 7 days free</p>
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

      {/* ═══════════ Main Chat Area ═══════════ */}
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

            <div className="flex items-center gap-2">
              <span className="text-base">{currentProvider?.icon}</span>
              <select
                value={selectedModel}
                onChange={(e) => {
                  setSelectedModel(e.target.value);
                  setErrorCode(null);
                }}
                className="bg-[#1a1a2e] border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
              >
                {currentModels.map((m) => (
                  <option key={m.id} value={m.id} disabled={!canUseModel(m)}>
                    {m.name} {!canUseModel(m) ? '🔒' : ''}
                  </option>
                ))}
              </select>
              {selectedModelConfig && (
                <span className={`text-[10px] hidden sm:inline ${selectedModelConfig.tier === 'free' ? 'text-green-400' : 'text-amber-400'}`}>
                  {selectedModelConfig.tier === 'free' ? 'FREE' : 'PREMIUM'} · {selectedModelConfig.description}
                </span>
              )}
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

        {/* Error Banner */}
        {errorBanner && (
          <div className="bg-amber-900/30 border-b border-amber-800/50 px-4 py-3 flex items-center justify-between">
            <div>
              <span className="text-amber-400 font-medium text-sm">{errorBanner.title}</span>
              <span className="text-amber-300/70 text-sm ml-2">{errorBanner.message}</span>
            </div>
            {errorBanner.cta && errorBanner.href && (
              <a href={errorBanner.href} className="px-3 py-1.5 bg-amber-500 text-black rounded-lg text-xs font-semibold hover:bg-amber-400 transition-colors shrink-0">
                {errorBanner.cta}
              </a>
            )}
            <button onClick={() => setErrorCode(null)} className="p-1 text-amber-400 hover:text-white ml-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

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
                    {selectedModelConfig?.name}
                  </span>
                  {selectedModelConfig?.tier === 'free' && (
                    <span className="text-green-400 text-xs ml-1">FREE</span>
                  )}
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
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${
                        m.role === 'user'
                          ? 'bg-blue-600'
                          : 'bg-gradient-to-br from-purple-500 to-blue-500'
                      }`}
                    >
                      {m.role === 'user' ? 'U' : currentProvider?.icon}
                    </div>
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

            {error && !errorCode && (
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
            {currentModelIsPremium && userPlan !== 'PREMIUM' && (
              <div className="mb-2 px-3 py-1.5 bg-amber-900/30 border border-amber-800/50 rounded-lg flex items-center gap-2">
                <LockIcon />
                <span className="text-amber-300 text-xs">This is a Premium model. </span>
                <a href="/pricing" className="text-amber-400 text-xs font-medium hover:underline">Upgrade</a>
              </div>
            )}
            <div className="flex gap-2 items-end">
              <div className="flex-1 relative">
                <textarea
                  className="w-full px-4 py-3 bg-[#1a1a2e] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none placeholder-gray-500"
                  value={input}
                  placeholder={`Message ${selectedModelConfig?.name || '...'}...`}
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
                    strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </div>
            <p className="text-[10px] text-gray-600 mt-2 text-center">
              {currentProvider?.name} · {selectedModelConfig?.name} · {selectedModelConfig?.tier === 'free' ? 'Free Model' : 'Premium Model'} · Responses may be inaccurate
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}