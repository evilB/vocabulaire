import type { Card, Lesson, Progress } from '../types';
import { overdueMs } from './srs';

export interface LessonScore {
  lesson: Lesson;
  cardCount: number;
  dueCount: number;
  totalOverdueMs: number;
}

/** Returns lessons ranked by how urgently they need practice. */
export function rankLessons(
  lessons: Lesson[],
  cards: Card[],
  progress: Progress[],
): LessonScore[] {
  const now = Date.now();

  return lessons
    .map((lesson) => {
      const lessonCards = cards.filter((c) => c.lessonId === lesson.id);
      let dueCount = 0;
      let totalOverdueMs = 0;

      for (const card of lessonCards) {
        for (const dir of ['nl-fr', 'fr-nl'] as const) {
          const p = progress.find(
            (x) => x.cardId === card.id && x.direction === dir,
          );
          const due = p ? p.nextReview : 0;
          if (due <= now) {
            dueCount++;
            totalOverdueMs += overdueMs(p ?? { nextReview: 0 } as Progress);
          }
        }
      }

      return { lesson, cardCount: lessonCards.length, dueCount, totalOverdueMs };
    })
    .sort((a, b) => b.totalOverdueMs - a.totalOverdueMs);
}
