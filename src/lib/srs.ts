import type { Progress, Direction } from '../types';

const MIN_EASE = 1.3;
const INITIAL_EASE = 2.5;

export function getOrCreateProgress(
  allProgress: Progress[],
  cardId: string,
  direction: Direction,
): Progress {
  return (
    allProgress.find((p) => p.cardId === cardId && p.direction === direction) ?? {
      cardId,
      direction,
      nextReview: 0,
      interval: 1,
      easeFactor: INITIAL_EASE,
      repetitions: 0,
    }
  );
}

/** Returns updated Progress entry after a review.
 *  correct = true  → SM-2 advance
 *  correct = false → reset repetitions, interval back to 1 day
 */
export function updateProgress(current: Progress, correct: boolean): Progress {
  const now = Date.now();
  if (!correct) {
    return {
      ...current,
      repetitions: 0,
      interval: 1,
      easeFactor: Math.max(MIN_EASE, current.easeFactor - 0.2),
      nextReview: now + msFromDays(1),
    };
  }

  const nextInterval =
    current.repetitions === 0
      ? 1
      : current.repetitions === 1
      ? 6
      : Math.round(current.interval * current.easeFactor);

  return {
    ...current,
    repetitions: current.repetitions + 1,
    interval: nextInterval,
    easeFactor: Math.max(MIN_EASE, current.easeFactor + 0.1),
    nextReview: now + msFromDays(nextInterval),
  };
}

function msFromDays(days: number): number {
  return days * 24 * 60 * 60 * 1000;
}

/** How many ms overdue is this progress entry (negative = not yet due). */
export function overdueMs(progress: Progress): number {
  return Date.now() - progress.nextReview;
}
