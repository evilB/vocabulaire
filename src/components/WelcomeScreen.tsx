import { useState } from 'react';

interface Props {
  onSave: (name: string) => void;
}

export default function WelcomeScreen({ onSave }: Props) {
  const [input, setInput] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = input.trim();
    if (!name) return;
    onSave(name);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-blue-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-sm w-full text-center space-y-6">
        <p className="text-6xl">🦊</p>
        <div>
          <h1 className="text-2xl font-extrabold text-purple-700">Bienvenue !</h1>
          <p className="text-gray-500 mt-2 text-sm">
            Comment tu t'appelles ?
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ton prénom…"
            autoFocus
            className="w-full text-center text-lg font-semibold border-2 border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:border-purple-400 transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="w-full bg-purple-500 text-white py-3 rounded-2xl font-bold text-lg hover:bg-purple-600 disabled:opacity-40 transition-colors"
          >
            Allons-y ! →
          </button>
        </form>
      </div>
    </div>
  );
}
