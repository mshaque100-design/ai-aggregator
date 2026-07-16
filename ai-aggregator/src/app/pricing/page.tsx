'use client';

import { useState } from 'react';
import { SignInButton, useUser } from '@clerk/nextjs';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '',
    description: 'Try it out',
    credits: '10 credits',
    features: ['10 messages free', 'All AI models', 'Basic support'],
    cta: 'Get Started',
    priceId: null,
    popular: false,
  },
  {
    name: 'Credit Pack',
    price: '$4.99',
    period: '/100 credits',
    description: 'Pay as you go',
    credits: '100 credits',
    features: ['100 messages', 'All AI models', 'No expiration', 'Priority support'],
    cta: 'Buy Credits',
    priceId: process.env.NEXT_PUBLIC_STRIPE_CREDITS_100_PRICE_ID,
    popular: false,
  },
  {
    name: 'Pro',
    price: '$9.99',
    period: '/month',
    description: 'Unlimited power',
    credits: '500 credits/mo',
    features: ['500 messages/month', 'All AI models', 'Priority queue', 'Early access to new models', 'Premium support'],
    cta: 'Subscribe',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID,
    popular: true,
  },
  {
    name: 'Power Pack',
    price: '$19.99',
    period: '/500 credits',
    description: 'Best value',
    credits: '500 credits',
    features: ['500 messages', 'All AI models', 'No expiration', 'Priority support', 'Best per-message rate'],
    cta: 'Buy Credits',
    priceId: process.env.NEXT_PUBLIC_STRIPE_CREDITS_500_PRICE_ID,
    popular: false,
  },
];

export default function PricingPage() {
  const { isSignedIn } = useUser();
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (priceId: string) => {
    if (!isSignedIn) return;
    setLoading(priceId);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, mode: priceId === plans[2].priceId ? 'subscription' : 'payment' }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
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
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
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

      {/* Pricing Cards */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Simple, transparent pricing</h2>
          <p className="text-gray-400 max-w-lg mx-auto">
            Start free with 10 credits. Upgrade anytime for more messages and premium features.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-6 flex flex-col ${
                plan.popular
                  ? 'border-blue-500 bg-blue-500/5 ring-1 ring-blue-500/30'
                  : 'border-gray-800 bg-[#0d0d1a]'
              }`}
            >
              {plan.popular && (
                <span className="text-[10px] uppercase tracking-wider font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded-full w-fit mb-3">
                  Most Popular
                </span>
              )}
              <h3 className="text-xl font-bold">{plan.name}</h3>
              <p className="text-sm text-gray-400 mt-1">{plan.description}</p>
              <div className="mt-4">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-gray-400 text-sm">{plan.period}</span>
              </div>
              <p className="text-sm text-blue-400 mt-1">{plan.credits}</p>
              <ul className="mt-6 space-y-2 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="text-sm text-gray-300 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => plan.priceId && handleCheckout(plan.priceId)}
                disabled={loading === plan.priceId || (!isSignedIn && !!plan.priceId)}
                className={`mt-6 w-full py-2.5 rounded-xl text-sm font-medium transition-all ${
                  plan.popular
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {!isSignedIn && plan.priceId ? (
                  <SignInButton mode="modal">
                    <span>{plan.cta}</span>
                  </SignInButton>
                ) : (
                  plan.cta
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}