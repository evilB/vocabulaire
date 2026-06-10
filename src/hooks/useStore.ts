import { useState, useCallback } from 'react';
import type { Card, Lesson, Progress, SessionLog } from '../types';
import type { BackupData } from '../lib/storage';
import {
  getCards,
  getLessons,
  getAllProgress,
  getSessionLogs,
  saveCards,
  saveLessons,
  saveAllProgress,
  saveSessionLogs,
  generateId,
} from '../lib/storage';

export function useStore() {
  const [lessons, setLessonsState] = useState<Lesson[]>(getLessons);
  const [cards, setCardsState] = useState<Card[]>(getCards);
  const [progress, setProgressState] = useState<Progress[]>(getAllProgress);
  const [sessionLogs, setSessionLogsState] = useState<SessionLog[]>(getSessionLogs);

  // false = soepel (accenten tellen niet mee), true = streng (exacte accenten vereist)
  const [strictMode, setStrictModeState] = useState<boolean>(() => {
    return localStorage.getItem('fc_strict') === 'true';
  });

  const setStrictMode = useCallback((v: boolean) => {
    localStorage.setItem('fc_strict', String(v));
    setStrictModeState(v);
  }, []);

  const [userName, setUserNameState] = useState<string>(() => {
    return localStorage.getItem('fc_user_name') ?? '';
  });

  const setUserName = useCallback((name: string) => {
    localStorage.setItem('fc_user_name', name);
    setUserNameState(name);
  }, []);

  const setLessons = useCallback((next: Lesson[]) => {
    saveLessons(next);
    setLessonsState(next);
  }, []);

  const setCards = useCallback((next: Card[]) => {
    saveCards(next);
    setCardsState(next);
  }, []);

  const setProgress = useCallback((next: Progress[]) => {
    saveAllProgress(next);
    setProgressState(next);
  }, []);

  const setSessionLogs = useCallback((next: SessionLog[]) => {
    saveSessionLogs(next);
    setSessionLogsState(next);
  }, []);

  // Lessons
  const addLesson = useCallback(
    (name: string): Lesson => {
      const lesson: Lesson = { id: generateId(), name, createdAt: Date.now() };
      setLessons([...lessons, lesson]);
      return lesson;
    },
    [lessons, setLessons],
  );

  const renameLesson = useCallback(
    (id: string, name: string) => {
      setLessons(lessons.map((l) => (l.id === id ? { ...l, name } : l)));
    },
    [lessons, setLessons],
  );

  const deleteLesson = useCallback(
    (id: string) => {
      setLessons(lessons.filter((l) => l.id !== id));
      const remaining = cards.filter((c) => c.lessonId !== id);
      const deletedCardIds = cards.filter((c) => c.lessonId === id).map((c) => c.id);
      setCards(remaining);
      setProgress(progress.filter((p) => !deletedCardIds.includes(p.cardId)));
    },
    [lessons, cards, progress, setLessons, setCards, setProgress],
  );

  // Cards
  const addCard = useCallback(
    (lessonId: string, dutch: string, french: string): Card => {
      const card: Card = { id: generateId(), lessonId, dutch, french, createdAt: Date.now() };
      setCards([...cards, card]);
      return card;
    },
    [cards, setCards],
  );

  const addCards = useCallback(
    (lessonId: string, pairs: { dutch: string; french: string }[]): Card[] => {
      const newCards: Card[] = pairs.map((p) => ({
        id: generateId(),
        lessonId,
        dutch: p.dutch,
        french: p.french,
        createdAt: Date.now(),
      }));
      setCards([...cards, ...newCards]);
      return newCards;
    },
    [cards, setCards],
  );

  const updateCard = useCallback(
    (id: string, dutch: string, french: string) => {
      setCards(cards.map((c) => (c.id === id ? { ...c, dutch, french } : c)));
    },
    [cards, setCards],
  );

  const deleteCard = useCallback(
    (id: string) => {
      setCards(cards.filter((c) => c.id !== id));
      setProgress(progress.filter((p) => p.cardId !== id));
    },
    [cards, progress, setCards, setProgress],
  );

  // Progress
  const upsertProgress = useCallback(
    (entry: Progress) => {
      const exists = progress.findIndex(
        (p) => p.cardId === entry.cardId && p.direction === entry.direction,
      );
      const next =
        exists >= 0
          ? progress.map((p, i) => (i === exists ? entry : p))
          : [...progress, entry];
      setProgress(next);
    },
    [progress, setProgress],
  );

  // Import backup — merges lessons/cards (by id), replaces progress for imported cards
  const importBackup = useCallback(
    (data: BackupData) => {
      // Merge lessons (skip duplicates by id)
      const existingLessonIds = new Set(lessons.map((l) => l.id));
      const newLessons = [...lessons, ...data.lessons.filter((l) => !existingLessonIds.has(l.id))];

      // Merge cards (skip duplicates by id)
      const existingCardIds = new Set(cards.map((c) => c.id));
      const newCards = [...cards, ...data.cards.filter((c) => !existingCardIds.has(c.id))];

      // Merge progress (imported entries overwrite existing ones for same cardId+direction)
      const importedProgress = data.progress ?? [];
      const filteredProgress = progress.filter(
        (p) =>
          !importedProgress.some(
            (ip) => ip.cardId === p.cardId && ip.direction === p.direction,
          ),
      );
      const newProgress = [...filteredProgress, ...importedProgress];

      saveLessons(newLessons);
      saveCards(newCards);
      saveAllProgress(newProgress);
      setLessonsState(newLessons);
      setCardsState(newCards);
      setProgressState(newProgress);
    },
    [lessons, cards, progress],
  );

  // Session logs
  const addSessionLog = useCallback(
    (log: Omit<SessionLog, 'id'>) => {
      const entry: SessionLog = { ...log, id: generateId() };
      setSessionLogs([entry, ...sessionLogs]);
    },
    [sessionLogs, setSessionLogs],
  );

  return {
    lessons,
    cards,
    progress,
    sessionLogs,
    strictMode,
    setStrictMode,
    userName,
    setUserName,
    addLesson,
    renameLesson,
    deleteLesson,
    addCard,
    addCards,
    updateCard,
    deleteCard,
    upsertProgress,
    addSessionLog,
    importBackup,
  };
}

export type Store = ReturnType<typeof useStore>;
