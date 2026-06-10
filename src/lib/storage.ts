import type { Card, Lesson, Progress, SessionLog } from '../types';

const KEYS = {
  lessons: 'fc_lessons',
  cards: 'fc_cards',
  progress: 'fc_progress',
  sessions: 'fc_sessions',
} as const;

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// Lessons
export function getLessons(): Lesson[] {
  return load<Lesson[]>(KEYS.lessons, []);
}

export function saveLessons(lessons: Lesson[]): void {
  save(KEYS.lessons, lessons);
}

// Cards
export function getCards(): Card[] {
  return load<Card[]>(KEYS.cards, []);
}

export function saveCards(cards: Card[]): void {
  save(KEYS.cards, cards);
}

// Progress
export function getAllProgress(): Progress[] {
  return load<Progress[]>(KEYS.progress, []);
}

export function saveAllProgress(progress: Progress[]): void {
  save(KEYS.progress, progress);
}

// Session logs
export function getSessionLogs(): SessionLog[] {
  return load<SessionLog[]>(KEYS.sessions, []);
}

export function saveSessionLogs(logs: SessionLog[]): void {
  save(KEYS.sessions, logs);
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ---------------------------------------------------------------------------
// Export / Import
// ---------------------------------------------------------------------------

export interface BackupData {
  version: 1;
  exportDate: string;
  lessons: Lesson[];
  cards: Card[];
  progress: Progress[];
}

export function exportBackup(lessons: Lesson[], cards: Card[], progress: Progress[]): void {
  const data: BackupData = {
    version: 1,
    exportDate: new Date().toISOString(),
    lessons,
    cards,
    progress,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const date = new Date().toISOString().slice(0, 10);
  const a = document.createElement('a');
  a.href = url;
  a.download = `flashcards-backup-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseBackupFile(file: File): Promise<BackupData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as BackupData;
        if (data.version !== 1 || !Array.isArray(data.lessons) || !Array.isArray(data.cards)) {
          reject(new Error('Ongeldig bestandsformaat'));
        } else {
          resolve(data);
        }
      } catch {
        reject(new Error('Kan bestand niet lezen'));
      }
    };
    reader.onerror = () => reject(new Error('Bestand lezen mislukt'));
    reader.readAsText(file);
  });
}
