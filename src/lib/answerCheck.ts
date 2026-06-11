export type AnswerResult = 'correct' | 'almost' | 'wrong';

export type TokenType = 'exact' | 'accent' | 'extra' | 'missing';

export interface CharToken {
  char: string;
  type: TokenType;
}

export interface DiffResult {
  inputTokens: CharToken[];
  expectedTokens: CharToken[];
}

function normalizeChar(c: string): string {
  return c.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function normalizeStrict(s: string): string {
  return s.trim().toLowerCase();
}

function normalizeLoose(s: string): string {
  return s.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** Check the answer. 'almost' means correct letters but wrong accents. */
export function checkAnswer(input: string, expected: string): AnswerResult {
  if (normalizeStrict(input) === normalizeStrict(expected)) return 'correct';
  if (normalizeLoose(input) === normalizeLoose(expected)) return 'almost';
  return 'wrong';
}

export interface MultiCheckResult {
  result: AnswerResult;
  /** The synonym that matched best (or synonyms[0] when all wrong). */
  matched: string;
}

/** Check input against multiple synonyms, returning the best match. */
export function checkAnswerMulti(input: string, synonyms: string[]): MultiCheckResult {
  for (const syn of synonyms) {
    if (checkAnswer(input, syn) === 'correct') return { result: 'correct', matched: syn };
  }
  for (const syn of synonyms) {
    if (checkAnswer(input, syn) === 'almost') return { result: 'almost', matched: syn };
  }
  return { result: 'wrong', matched: synonyms[0] };
}

/** Whether the result should be accepted (count as correct) given the mode. */
export function isAccepted(result: AnswerResult, strict: boolean): boolean {
  return result === 'correct' || (result === 'almost' && !strict);
}

// ---------------------------------------------------------------------------
// Character-level diff using LCS aligned on accent-normalized characters
// ---------------------------------------------------------------------------

function buildLCS(a: string, b: string): number[][] {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        normalizeChar(a[i - 1]) === normalizeChar(b[j - 1])
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp;
}

export function computeDiff(rawInput: string, rawExpected: string): DiffResult {
  const a = rawInput.trim();
  const b = rawExpected.trim();
  const dp = buildLCS(a, b);

  type Op =
    | { type: 'match'; ai: number; bi: number }
    | { type: 'extra'; ai: number }
    | { type: 'missing'; bi: number };

  const ops: Op[] = [];
  let i = a.length, j = b.length;

  while (i > 0 || j > 0) {
    if (
      i > 0 &&
      j > 0 &&
      normalizeChar(a[i - 1]) === normalizeChar(b[j - 1])
    ) {
      ops.unshift({ type: 'match', ai: i - 1, bi: j - 1 });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.unshift({ type: 'missing', bi: j - 1 });
      j--;
    } else {
      ops.unshift({ type: 'extra', ai: i - 1 });
      i--;
    }
  }

  const inputTokens: CharToken[] = [];
  const expectedTokens: CharToken[] = [];

  for (const op of ops) {
    if (op.type === 'match') {
      // Same base letter — check if accent also matches exactly
      const accentDiff = a[op.ai].toLowerCase() !== b[op.bi].toLowerCase();
      inputTokens.push({ char: a[op.ai], type: accentDiff ? 'accent' : 'exact' });
      expectedTokens.push({ char: b[op.bi], type: accentDiff ? 'accent' : 'exact' });
    } else if (op.type === 'extra') {
      inputTokens.push({ char: a[op.ai], type: 'extra' });
    } else {
      expectedTokens.push({ char: b[op.bi], type: 'missing' });
    }
  }

  return { inputTokens, expectedTokens };
}
