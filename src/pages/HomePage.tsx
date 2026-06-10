import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Store } from '../hooks/useStore';
import { rankLessons } from '../lib/recommendations';
import type { Direction } from '../types';

interface Props {
  store: Store;
}

type DirectionChoice = Direction | 'both';

const DIRECTION_OPTIONS: { value: DirectionChoice; label: string }[] = [
  { value: 'both', label: 'Beide richtingen' },
  { value: 'nl-fr', label: 'NL → FR' },
  { value: 'fr-nl', label: 'FR → NL' },
];

export default function HomePage({ store }: Props) {
  const navigate = useNavigate();
  const { lessons, cards, progress, strictMode, setStrictMode, userName } = store;
  const ranked = rankLessons(lessons, cards, progress);
  const [direction, setDirection] = useState<DirectionChoice>('both');

  function startQuiz(lessonId?: string) {
    const params = new URLSearchParams();
    if (lessonId) {
      params.set('lessonId', lessonId);
    } else {
      params.set('all', '1');
    }
    if (direction !== 'both') params.set('dir', direction);
    navigate(`/quiz?${params.toString()}`);
  }

  const totalDue = ranked.reduce((s, r) => s + r.dueCount, 0);
  const recommended = ranked[0];

  return (
    <div className="space-y-6">
      <div className="text-center pt-2">
        <h1 className="text-3xl font-extrabold text-purple-700">Bonjour, {userName}! 🌟</h1>
        <p className="text-gray-500 mt-1">Qu'est-ce que tu veux pratiquer aujourd'hui?</p>
      </div>

      {/* Direction + mode selector */}
      {cards.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Richting</p>
            <div className="flex gap-2">
              {DIRECTION_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setDirection(value)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    direction === value
                      ? 'bg-purple-500 text-white shadow'
                      : 'bg-gray-100 text-gray-600 hover:bg-purple-100 hover:text-purple-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Accenten</p>
            <div className="flex gap-2">
              <button
                onClick={() => setStrictMode(false)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  !strictMode
                    ? 'bg-green-500 text-white shadow'
                    : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700'
                }`}
              >
                😊 Soepel
              </button>
              <button
                onClick={() => setStrictMode(true)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  strictMode
                    ? 'bg-red-500 text-white shadow'
                    : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-700'
                }`}
              >
                🎯 Streng
              </button>
            </div>
            <p className="text-xs text-gray-400">
              {strictMode
                ? 'Exacte accenten vereist — é ≠ e'
                : 'Accenten worden vergeven — é = e (maar wel getoond)'}
            </p>
          </div>
        </div>
      )}

      {/* Practice all */}
      {cards.length > 0 && (
        <button
          onClick={() => startQuiz()}
          className="w-full py-5 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold text-lg shadow-md hover:shadow-lg transition-shadow"
        >
          🎯 Alle kaarten oefenen
          {totalDue > 0 && (
            <span className="ml-2 bg-white/20 text-sm px-2 py-0.5 rounded-full">
              {totalDue} klaar
            </span>
          )}
        </button>
      )}

      {/* Recommended lesson */}
      {recommended && recommended.dueCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">
            ⭐ Aanbevolen
          </p>
          <button
            onClick={() => startQuiz(recommended.lesson.id)}
            className="w-full text-left"
          >
            <p className="font-bold text-gray-800 text-lg">{recommended.lesson.name}</p>
            <p className="text-sm text-gray-500">
              {recommended.dueCount} kaart{recommended.dueCount !== 1 ? 'en' : ''} klaar voor herhaling
            </p>
          </button>
        </div>
      )}

      {/* Lesson list */}
      {ranked.length > 0 ? (
        <div className="space-y-3">
          <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Alle lessen</h2>
          {ranked.map(({ lesson, cardCount, dueCount }) => (
            <div
              key={lesson.id}
              className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3"
            >
              <div className="flex-1">
                <p className="font-bold text-gray-800">{lesson.name}</p>
                <p className="text-sm text-gray-400">
                  {cardCount} kaart{cardCount !== 1 ? 'en' : ''}
                  {dueCount > 0 && (
                    <span className="ml-2 text-orange-500 font-semibold">
                      · {dueCount} klaar
                    </span>
                  )}
                </p>
              </div>
              {cardCount > 0 && (
                <button
                  onClick={() => startQuiz(lesson.id)}
                  className="bg-purple-100 text-purple-700 font-semibold px-4 py-2 rounded-xl text-sm hover:bg-purple-200 transition-colors"
                >
                  Oefenen
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <p className="text-5xl mb-4">📭</p>
          <p className="font-semibold">Nog geen lessen.</p>
          <p className="text-sm mt-1">
            Ga naar <strong>Lessen</strong> om je eerste les aan te maken.
          </p>
        </div>
      )}
    </div>
  );
}
