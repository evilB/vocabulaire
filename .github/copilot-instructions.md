# Copilot Instructions

## Commands

```bash
npm run dev      # start dev server (Vite, http://localhost:5173)
npm run build    # TypeScript check + production build
npm run lint     # ESLint
```

No test suite exists yet.

## Architecture

Frontend-only React + TypeScript app built with Vite. All state is persisted to **localStorage** — no backend, no database.

```
src/
  types/index.ts        # Shared TypeScript types: Card, Lesson, Direction, Progress, SessionLog, QuizScope
  lib/
    storage.ts          # Raw localStorage get/save helpers; generateId()
    srs.ts              # SM-2 spaced repetition logic (getOrCreateProgress, updateProgress, overdueMs)
    recommendations.ts  # rankLessons() — scores lessons by how overdue their cards are
  hooks/
    useStore.ts         # Single central state hook; wraps all localStorage state with typed mutators
  components/
    Layout.tsx          # Sticky nav header + page wrapper (max-w-2xl centered)
    ProgressBar.tsx     # Reusable 0–1 progress bar
  pages/
    HomePage.tsx        # Session-start screen: recommended lesson + lesson list + "Practice All"
    LessonListPage.tsx  # Create / delete lessons
    LessonDetailPage.tsx # View/add/edit/delete cards; link to ImportPage
    ImportPage.tsx      # Paste tab- or comma-separated dutch/french pairs → preview → import
    QuizPage.tsx        # Core quiz: type-answer mode, SM-2 scheduling, session tracking
    HistoryPage.tsx     # Session log list + aggregate stats
```

### State management

`useStore` in `hooks/useStore.ts` is the single source of truth. It is instantiated once in `App.tsx` and passed as a `store` prop to every page. Pages never call `localStorage` directly — they use `store.*` methods.

All mutators in `useStore` call the corresponding `save*` function from `storage.ts` before updating React state, so state is always persisted synchronously.

### Routing

React Router v6 (`BrowserRouter`). All routes are defined in `App.tsx`. The `store` object is passed as a prop — there is no context or global state provider.

| Path | Page |
|---|---|
| `/` | HomePage |
| `/lessons` | LessonListPage |
| `/lessons/:id` | LessonDetailPage |
| `/lessons/:id/import` | ImportPage |
| `/quiz?lessonId=X` or `/quiz?all=1` | QuizPage |
| `/history` | HistoryPage |

### Spaced repetition (SM-2)

`lib/srs.ts` implements a simplified SM-2 algorithm:
- **Correct**: interval multiplied by easeFactor, repetitions++, easeFactor += 0.1
- **Wrong**: interval resets to 1 day, repetitions = 0, easeFactor -= 0.2 (min 1.3)
- Initial ease factor: 2.5. First two correct answers use fixed intervals (1 day, 6 days).

`Progress` entries are keyed by `{ cardId, direction }` — each card has two independent progress records (nl-fr and fr-nl).

### Quiz session

`QuizPage` builds a queue of due cards (both directions, capped at 40) sorted by how overdue they are. On session end it calls `store.addSessionLog()` which prepends the log entry. The quiz navigates via `?lessonId=X` (specific lesson) or `?all=1` (all cards).

## Key conventions

- **Props pattern**: pages receive `store: Store` as their only prop. Add new state/actions to `useStore`, not to individual pages.
- **IDs**: always generated with `generateId()` from `storage.ts` (`${Date.now()}-${randomBase36}`).
- **Tailwind only**: no CSS modules, no styled-components. All styling is Tailwind utility classes. Color palette is purple/indigo primary, amber for recommendations, green/red for quiz feedback.
- **Normalization for answer checking**: `normalize()` in `QuizPage` strips accents and lowercases before comparing — so "école" matches "ecole".
- **localStorage keys**: prefixed `fc_` (lessons, cards, progress, sessions). Do not rename keys without migrating existing data.
- **No test framework is configured** — validate changes with `npm run build` (TypeScript) and manual browser testing.
