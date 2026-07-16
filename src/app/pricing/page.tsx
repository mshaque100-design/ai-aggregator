'use client';

import { useState } from 'react';
import { SignInButton, useUser } from '@clerk/nextjs';

const plans = [
  {
    name: 'Pro',
    price: '$20',
    period: '/year',
    description: 'Unlimited free models',
    badge: 'Best Value',
    features: [
      'All 10+ free AI models unlimited',
      'DeepSeek V3, Llama 3.3 70B, Qwen 2.5',
      'Gemma 2, Mistral 7B, Phi-3, Hermes, Zephyr',
      'No daily limits on free models',
      '7-day free trial included',
    ],
    cta: 'Subscribe $20/year',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
    mode: 'subscription' as const,
    popular: true,
  },
  {
    name: 'Premium',
    price: '$49',
    period: '/year',
    description: 'All models including GPT-4o & Claude',
    badge: 'Full Power',
    features: [
      'Everything in Pro, plus:',
      'GPT-4o, GPT-4o Mini',
      'Claude 4 Sonnet, Claude 3.5, Claude Opus',
      'Grok 3',
      'Daily limits on premium models',
      'Priority support',
    ],
    cta: 'Subscribe $49/year',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID,
    mode: 'subscription' as const,
    popular: false,
  },
];

export default function PricingPage() {
  const { isSignedIn } = useUser();
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (priceId: string, mode: string) => {
    if (!isSignedIn) return;
    setLoading(priceId);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, mode }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        alert(data.error);
      }
    } catch {
      alert('Checkout failed. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-[#0d0d1a]/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="AI Aggregator" className="w-9 h-9 rounded-lg" />
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                AI Aggregator
              </h1>
              <p className="text-xs text-gray-500">Pricing</p>
            </div>
          </div>
          <a href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
            &larr; Back to Chat
          </a>
        </div>
      </div>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-6 pt-16 pb-8 text-center">
        <h2 className="text-4xl font-bold mb-4">
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Start free. Upgrade when ready.
          </span>
        </h2>
        <p className="text-gray-400 max-w-xl mx-auto text-lg">
          Get 7 days of free access to 10+ AI models. No credit card required.
        </p>
      </div>

      {/* Free Tier Banner */}
      <div className="max-w-5xl mx-auto px-6 pb-8">
        <div className="rounded-2xl border border-gray-800 bg-[#0d0d1a] p-6 flex flex-col sm:flex-row items-center gap-6">
          <div className="text-5xl">🆓</div>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
              <h3 className="text-xl font-bold">Free Trial</h3>
              <span className="text-[10px] uppercase tracking-wider font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">7 Days</span>
            </div>
            <p className="text-gray-400 text-sm">
              Full access to all free models: DeepSeek V3, Llama 3.3 70B, Qwen 2.5 72B, Gemma 2, Mistral 7B, Phi-3, Hermes, Zephyr, and more. No credit card needed.
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-3xl font-bold">$0</div>
            <div className="text-xs text-gray-500">for 7 days</div>
          </div>
        </div>
      </div>

      {/* Paid Plans */}
      <div className="max-w-5xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-8 flex flex-col ${
                plan.popular
                  ? 'border-blue-500 bg-blue-500/5 ring-1 ring-blue-500/30 relative'
                  : 'border-gray-800 bg-[#0d0d1a]'
              }`}
            >
              {plan.badge && (
                <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full w-fit mb-4 ${
                  plan.popular
                    ? 'text-blue-400 bg-blue-500/10'
                    : 'text-purple-400 bg-purple-500/10'
                }`}>
                  {plan.badge}
                </span>
              )}
              <h3 className="text-2xl font-bold">{plan.name}</h3>
              <p className="text-sm text-gray-400 mt-1">{plan.description}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-gray-400">{plan.period}</span>
              </div>
              <ul className="mt-8 space-y-3 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="text-sm text-gray-300 flex items-start gap-2.5">
                    <svg className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => plan.priceId && handleCheckout(plan.priceId, plan.mode)}
                disabled={loading === plan.priceId || (!isSignedIn && !!plan.priceId)}
                className={`mt-8 w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                  plan.popular
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {!isSignedIn && plan.priceId ? (
                  <SignInButton mode="modal">
                    <span>{plan.cta}</span>
                  </SignInButton>
                ) : loading === plan.priceId ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  plan.cta
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">Secure payments via Stripe. Cancel anytime. No hidden fees.</p>
          <div className="flex items-center justify-center gap-6 mt-4 text-xs text-gray-600">
            <span>🔒 SSL Encrypted</span>
            <span>💳 Stripe Powered</span>
            <span>↩️ Cancel Anytime</span>
          </div>
        </div>
      </div>
    </div>
  );
}