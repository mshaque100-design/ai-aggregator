// app/page.tsx
'use client';
import { useChat } from '@ai-sdk/react';

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat();

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto stretch h-screen p-4">
      <h1 className="text-2xl font-bold text-white mb-4">GLM Aggregator Agent</h1>
      
      <div className="flex-grow overflow-y-auto mb-4 bg-gray-900 p-4 rounded-lg">
        {messages.map(m => (
          <div key={m.id} className={`mb-4 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
            <span className={`inline-block p-3 rounded-lg ${m.role === 'user' ? 'bg-blue-600' : 'bg-gray-700'}`}>
              {m.content}
            </span>
          </div>
        ))}
        {isLoading && <div className="text-gray-400">Agent is thinking...</div>}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          className="flex-grow p-2 bg-gray-800 border border-gray-700 rounded text-white"
          value={input}
          placeholder="Ask the aggregator..."
          onChange={handleInputChange}
        />
        <button type="submit" className="p-2 bg-blue-600 rounded text-white">Send</button>
      </form>
    </div>
  );
}