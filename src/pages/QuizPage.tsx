import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import type { Store } from '../hooks/useStore';
import type { Card, Direction, Progress } from '../types';
import { getOrCreateProgress, updateProgress } from '../lib/srs';
import { checkAnswer, isAccepted, computeDiff } from '../lib/answerCheck';
import type { AnswerResult, DiffResult } from '../lib/answerCheck';
import ProgressBar from '../components/ProgressBar';
import DiffView from '../components/DiffView';

interface Props {
  store: Store;
}

interface QuizCard {
  card: Card;
  direction: Direction;
}

type DirectionFilter = Direction | 'both';

function buildQueue(
  cards: Card[],
  progress: Progress[],
  lessonId: string | null,
  dirFilter: DirectionFilter,
): QuizCard[] {
  const now = Date.now();
  const filtered = lessonId ? cards.filter((c) => c.lessonId === lessonId) : cards;
  const directions: Direction[] = dirFilter === 'both' ? ['nl-fr', 'fr-nl'] : [dirFilter];

  const due: { qc: QuizCard; overdueMs: number }[] = [];
  for (const card of filtered) {
    for (const dir of directions) {
      const p = progress.find((x) => x.cardId === card.id && x.direction === dir);
      const nextReview = p?.nextReview ?? 0;
      if (nextReview <= now) {
        due.push({ qc: { card, direction: dir }, overdueMs: now - nextReview });
      }
    }
  }

  due.sort((a, b) => b.overdueMs - a.overdueMs + (Math.random() - 0.5) * 60_000);
  return due.slice(0, 40).map((d) => d.qc);
}

const DIR_LABEL: Record<DirectionFilter, string> = {
  both: 'Beide richtingen',
  'nl-fr': 'Nederlands → Frans',
  'fr-nl': 'Frans → Nederlands',
};

interface ReviewResult {
  answerResult: AnswerResult;
  accepted: boolean;
  diff: DiffResult;
  expected: string;
}

export default function QuizPage({ store }: Props) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { cards, progress, upsertProgress, lessons, addSessionLog, strictMode } = store;

  const lessonId = params.get('lessonId');
  const isAll = params.get('all') === '1';
  const dirParam = params.get('dir') as Direction | null;
  const dirFilter: DirectionFilter = dirParam ?? 'both';

  const lessonName = useMemo(() => {
    if (isAll) return 'Alle kaarten';
    return lessons.find((l) => l.id === lessonId)?.name ?? 'Les';
  }, [isAll, lessonId, lessons]);

  const [queue, setQueue] = useState<QuizCard[]>(() =>
    buildQueue(cards, progress, lessonId, dirFilter),
  );
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const startTime = useRef(Date.now());

  const current = queue[index];

  useEffect(() => {
    if (!done) inputRef.current?.focus();
  }, [index, done]);

  if (queue.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-5xl">✨</p>
        <p className="text-xl font-bold text-purple-700">Niets te oefenen op dit moment!</p>
        <p className="text-gray-500 text-sm">Alle kaarten zijn up-to-date.</p>
        <button
          onClick={() => navigate('/')}
          className="bg-purple-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-purple-600 transition-colors"
        >
          Terug naar home
        </button>
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (reviewResult) {
      advance();
      return;
    }

    const expected =
      current.direction === 'nl-fr' ? current.card.french : current.card.dutch;

    const answerResult = checkAnswer(input, expected);
    const accepted = isAccepted(answerResult, strictMode);
    const diff = computeDiff(input, expected);

    const currentProgress = getOrCreateProgress(progress, current.card.id, current.direction);
    const nextProgress = updateProgress(currentProgress, accepted);
    upsertProgress(nextProgress);

    if (accepted) setCorrect((c) => c + 1);

    setReviewResult({ answerResult, accepted, diff, expected });
  }

  function advance() {
    if (index + 1 >= queue.length) {
      const duration = Math.round((Date.now() - startTime.current) / 1000);
      addSessionLog({
        date: startTime.current,
        duration,
        cardsTrained: queue.length,
        correctCount: correct,
        lessonId: lessonId ?? 'all',
        lessonName,
      });
      setDone(true);
    } else {
      setIndex((i) => i + 1);
      setInput('');
      setReviewResult(null);
    }
  }

  if (done) {
    const total = queue.length;
    const pct = Math.round((correct / total) * 100);
    const duration = Math.round((Date.now() - startTime.current) / 1000);
    return (
      <div className="text-center py-10 space-y-6">
        <p className="text-6xl">{pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '💪'}</p>
        <h2 className="text-2xl font-extrabold text-purple-700">Sessie voltooid!</h2>
        <div className="bg-white rounded-2xl shadow p-6 text-left space-y-3 max-w-sm mx-auto">
          <Row label="Kaarten geoefend" value={total} />
          <Row label="Goed" value={`${correct} (${pct}%)`} />
          <Row label="Duur" value={formatDuration(duration)} />
          <Row label="Les" value={lessonName} />
          <Row label="Richting" value={DIR_LABEL[dirFilter]} />
          <Row label="Modus" value={strictMode ? '🎯 Streng' : '😊 Soepel'} />
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate('/')}
            className="bg-purple-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-purple-600 transition-colors"
          >
            Home
          </button>
          <button
            onClick={() => {
              const newQueue = buildQueue(cards, progress, lessonId, dirFilter);
              setQueue(newQueue);
              setIndex(0);
              setCorrect(0);
              setInput('');
              setReviewResult(null);
              setDone(false);
              startTime.current = Date.now();
            }}
            className="bg-indigo-100 text-indigo-700 px-6 py-2.5 rounded-xl font-semibold hover:bg-indigo-200 transition-colors"
          >
            Opnieuw oefenen
          </button>
        </div>
      </div>
    );
  }

  const prompt =
    current.direction === 'nl-fr'
      ? { from: current.card.dutch, fromLang: '🇳🇱 Nederlands', toLang: '🇫🇷 Frans' }
      : { from: current.card.french, fromLang: '🇫🇷 Frans', toLang: '🇳🇱 Nederlands' };

  // Input field styling based on result
  const inputClass = reviewResult
    ? reviewResult.answerResult === 'correct'
      ? 'border-green-400 bg-green-50 text-green-700'
      : reviewResult.answerResult === 'almost'
      ? reviewResult.accepted
        ? 'border-amber-400 bg-amber-50 text-amber-700'  // lenient: almost = accepted
        : 'border-orange-400 bg-orange-50 text-orange-700' // strict: almost = wrong
      : 'border-red-400 bg-red-50 text-red-600'
    : 'border-gray-300 focus:border-purple-400';

  // Feedback badge
  const feedback = reviewResult
    ? reviewResult.answerResult === 'correct'
      ? { text: '✓ Goed!', cls: 'text-green-500' }
      : reviewResult.answerResult === 'almost' && reviewResult.accepted
      ? { text: '✓ Bijna goed! (accent)', cls: 'text-amber-500' }
      : reviewResult.answerResult === 'almost' && !reviewResult.accepted
      ? { text: '△ Bijna – let op accenten', cls: 'text-orange-500' }
      : { text: '✗ Niet helemaal', cls: 'text-red-500' }
    : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <ProgressBar value={index / queue.length} label={`${index} / ${queue.length}`} />
        </div>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
            strictMode
              ? 'bg-red-100 text-red-600'
              : 'bg-green-100 text-green-600'
          }`}
        >
          {strictMode ? '🎯 Streng' : '😊 Soepel'}
        </span>
      </div>

      <div className="bg-white rounded-3xl shadow-lg p-8 text-center space-y-2">
        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">
          {prompt.fromLang} → {prompt.toLang}
        </p>
        <p className="text-4xl font-extrabold text-gray-800 mt-2">{prompt.from}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={!!reviewResult}
          placeholder={`Typ in het ${current.direction === 'nl-fr' ? 'Frans' : 'Nederlands'}…`}
          className={`w-full text-center text-lg font-semibold border-2 rounded-2xl px-4 py-4 focus:outline-none transition-colors ${inputClass}`}
        />

        {/* Diff view for wrong or almost answers */}
        {reviewResult && reviewResult.answerResult !== 'correct' && (
          <DiffView diff={reviewResult.diff} />
        )}

        <button
          type="submit"
          className={`w-full py-3.5 rounded-2xl font-bold text-white text-lg transition-colors ${
            reviewResult
              ? 'bg-indigo-500 hover:bg-indigo-600'
              : 'bg-purple-500 hover:bg-purple-600'
          }`}
        >
          {reviewResult
            ? index + 1 >= queue.length
              ? 'Afronden →'
              : 'Volgende →'
            : 'Controleren'}
        </button>
      </form>

      {feedback && (
        <div className={`text-center text-2xl font-extrabold ${feedback.cls}`}>
          {feedback.text}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-bold text-gray-800">{value}</span>
    </div>
  );
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}
