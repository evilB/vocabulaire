export interface Card {
  id: string;
  lessonId: string;
  dutch: string;
  french: string;
  createdAt: number;
}

export interface Lesson {
  id: string;
  name: string;
  createdAt: number;
}

export type Direction = 'nl-fr' | 'fr-nl';

export interface Progress {
  cardId: string;
  direction: Direction;
  nextReview: number;   // ms timestamp of next review
  interval: number;     // current interval in days
  easeFactor: number;   // SM-2 ease factor (min 1.3)
  repetitions: number;  // consecutive correct answers
}

export interface SessionLog {
  id: string;
  date: number;         // ms timestamp when session started
  duration: number;     // seconds
  cardsTrained: number;
  correctCount: number;
  lessonId: string;     // lesson id or 'all'
  lessonName: string;
}

export type QuizScope = { type: 'lesson'; lessonId: string } | { type: 'all' };
