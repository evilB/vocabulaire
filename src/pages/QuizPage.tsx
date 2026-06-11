import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import type { Store } from '../hooks/useStore';
import type { Card, Direction, Progress } from '../types';
import { getOrCreateProgress, updateProgress } from '../lib/srs';
import { checkAnswerMulti, isAccepted, computeDiff } from '../lib/answerCheck';
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

  const all: { qc: QuizCard; repetitions: number; overdueMs: number }[] = [];
  for (const card of filtered) {
    for (const dir of directions) {
      const p = progress.find((x) => x.cardId === card.id && x.direction === dir);
      const overdueMs = now - (p?.nextReview ?? 0);
      all.push({ qc: { card, direction: dir }, repetitions: p?.repetitions ?? 0, overdueMs });
    }
  }

  // Least practiced first; within same repetition count, most overdue first
  all.sort((a, b) =>
    a.repetitions - b.repetitions ||
    b.overdueMs - a.overdueMs +
    (Math.random() - 0.5) * 60_000,
  );
  return all.slice(0, 40).map((d) => d.qc);
}

const DIR_LABEL: Record<DirectionFilter, string> = {
  both: 'Les deux sens',
  'nl-fr': 'Néerlandais → Français',
  'fr-nl': 'Français → Néerlandais',
};

interface ReviewResult {
  answerResult: AnswerResult;
  accepted: boolean;
  diff: DiffResult;
  expected: string;
  alternatives: string[];  // other valid synonyms not matched
}

/** All synonyms for the answer side of a card. */
function getAnswerSynonyms(card: Card, direction: Direction): string[] {
  if (direction === 'nl-fr') return card.frenchSynonyms ?? [card.french];
  return card.dutchSynonyms ?? [card.dutch];
}

/** All synonyms for the prompt (question) side of a card. */
function getPromptSynonyms(card: Card, direction: Direction): string[] {
  if (direction === 'nl-fr') return card.dutchSynonyms ?? [card.dutch];
  return card.frenchSynonyms ?? [card.french];
}

export default function QuizPage({ store }: Props) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { cards, progress, upsertProgress, lessons, addSessionLog, strictMode } = store;

  const lessonId = params.get('lessonId');
  const isAll = params.get('all') === '1';
  const dirParam = params.get('dir') as Direction | null;
  const dirFilter: DirectionFilter = dirParam ?? 'nl-fr';

  const lessonName = useMemo(() => {
    if (isAll) return 'Toutes les cartes';
    return lessons.find((l) => l.id === lessonId)?.name ?? 'Leçon';
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
  const nextBtnRef = useRef<HTMLButtonElement>(null);
  const startTime = useRef(Date.now());

  const current = queue[index];

  useEffect(() => {
    if (!done) inputRef.current?.focus();
  }, [index, done]);

  // After checking the answer, focus the "Suivant" button so Enter advances.
  useEffect(() => {
    if (reviewResult) nextBtnRef.current?.focus();
  }, [reviewResult]);

  if (queue.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-5xl">📚</p>
        <p className="text-xl font-bold text-purple-700">Aucune carte à pratiquer.</p>
        <p className="text-gray-500 text-sm">Ajoute des cartes à cette leçon d'abord.</p>
        <button
          onClick={() => navigate('/')}
          className="bg-purple-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-purple-600 transition-colors"
        >
          Retour à l'accueil
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

    const synonyms = getAnswerSynonyms(current.card, current.direction);
    const { result: answerResult, matched } = checkAnswerMulti(input, synonyms);
    const accepted = isAccepted(answerResult, strictMode);
    const diff = computeDiff(input, matched);
    const alternatives = synonyms.filter((s) => s !== matched);

    const currentProgress = getOrCreateProgress(progress, current.card.id, current.direction);
    const nextProgress = updateProgress(currentProgress, accepted);
    upsertProgress(nextProgress);

    if (accepted) setCorrect((c) => c + 1);

    setReviewResult({ answerResult, accepted, diff, expected: matched, alternatives });
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
        <h2 className="text-2xl font-extrabold text-purple-700">Session terminée !</h2>
        <div className="bg-white rounded-2xl shadow p-6 text-left space-y-3 max-w-sm mx-auto">
          <Row label="Cartes pratiquées" value={total} />
          <Row label="Correct" value={`${correct} (${pct}%)`} />
          <Row label="Durée" value={formatDuration(duration)} />
          <Row label="Leçon" value={lessonName} />
          <Row label="Direction" value={DIR_LABEL[dirFilter]} />
          <Row label="Mode" value={strictMode ? '🎯 Strict' : '😊 Souple'} />
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate('/')}
            className="bg-purple-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-purple-600 transition-colors"
          >
            Accueil
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
            Pratiquer à nouveau
          </button>
        </div>
      </div>
    );
  }

  const promptSynonyms = getPromptSynonyms(current.card, current.direction);
  const prompt =
    current.direction === 'nl-fr'
      ? { fromLang: '🇳🇱 Néerlandais', toLang: '🇫🇷 Français' }
      : { fromLang: '🇫🇷 Français', toLang: '🇳🇱 Néerlandais' };

  const inputClass = reviewResult
    ? reviewResult.answerResult === 'correct'
      ? 'border-green-400 bg-green-50 text-green-700'
      : reviewResult.answerResult === 'almost' && reviewResult.accepted
      ? 'border-amber-400 bg-amber-50 text-amber-700'
      : 'border-red-400 bg-red-50 text-red-600'
    : 'border-gray-300 focus:border-purple-400';

  const feedback = reviewResult
    ? reviewResult.answerResult === 'correct'
      ? { text: '✓ Correct !', cls: 'text-green-500' }
      : reviewResult.answerResult === 'almost' && reviewResult.accepted
      ? { text: '✓ Presque ! (accent)', cls: 'text-amber-500' }
      : reviewResult.answerResult === 'almost' && !reviewResult.accepted
      ? { text: '△ Presque — attention aux accents', cls: 'text-orange-500' }
      : { text: '✗ Pas tout à fait', cls: 'text-red-500' }
    : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <ProgressBar value={index / queue.length} label={`${index} / ${queue.length}`} />
        </div>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
            strictMode ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
          }`}
        >
          {strictMode ? '🎯 Strict' : '😊 Souple'}
        </span>
      </div>

      <div className="bg-white rounded-3xl shadow-lg p-8 text-center space-y-2">
        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">
          {prompt.fromLang} → {prompt.toLang}
        </p>
        <p className="text-4xl font-extrabold text-gray-800 mt-2">
          {promptSynonyms[0]}
        </p>
        {promptSynonyms.length > 1 && (
          <p className="text-sm text-gray-400 mt-1">
            {promptSynonyms.slice(1).join(' · ')}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={!!reviewResult}
          placeholder={`Écris en ${current.direction === 'nl-fr' ? 'français' : 'néerlandais'}…`}
          className={`w-full text-center text-lg font-semibold border-2 rounded-2xl px-4 py-4 focus:outline-none transition-colors ${inputClass}`}
        />

        {reviewResult && reviewResult.answerResult !== 'correct' && (
          <DiffView diff={reviewResult.diff} />
        )}

        <button
          ref={nextBtnRef}
          type="submit"
          className={`w-full py-3.5 rounded-2xl font-bold text-white text-lg transition-colors ${
            reviewResult ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-purple-500 hover:bg-purple-600'
          }`}
        >
          {reviewResult
            ? index + 1 >= queue.length ? 'Terminer →' : 'Suivant →'
            : 'Vérifier'}
        </button>
      </form>

      {feedback && (
        <div className={`text-center text-2xl font-extrabold ${feedback.cls}`}>
          {feedback.text}
        </div>
      )}

      {reviewResult && reviewResult.alternatives.length > 0 && (
        <div className="text-center text-sm text-gray-500">
          Aussi accepté : <span className="font-semibold text-gray-700">{reviewResult.alternatives.join(', ')}</span>
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
