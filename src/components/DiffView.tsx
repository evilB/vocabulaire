import type { CharToken, DiffResult } from '../lib/answerCheck';

const TOKEN_CLASS: Record<CharToken['type'], string> = {
  exact: 'text-gray-700',
  accent: 'bg-amber-100 text-amber-800 rounded px-0.5',
  extra: 'bg-red-100 text-red-600 line-through rounded px-0.5',
  missing: 'bg-green-100 text-green-700 rounded px-0.5',
};

function TokenSpan({ token }: { token: CharToken }) {
  return <span className={TOKEN_CLASS[token.type]}>{token.char}</span>;
}

interface Props {
  diff: DiffResult;
}

export default function DiffView({ diff }: Props) {
  const hasInputIssues = diff.inputTokens.some((t) => t.type !== 'exact');
  const hasMissing = diff.expectedTokens.some((t) => t.type !== 'exact');

  if (!hasInputIssues && !hasMissing) return null;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-2 text-sm font-mono">
      <div className="flex items-baseline gap-3">
        <span className="text-gray-400 text-xs w-24 shrink-0 text-right font-sans">Toi :</span>
        <span className="tracking-wide text-base leading-relaxed">
          {diff.inputTokens.map((t, i) => (
            <TokenSpan key={i} token={t} />
          ))}
        </span>
      </div>
      <div className="flex items-baseline gap-3">
        <span className="text-gray-400 text-xs w-24 shrink-0 text-right font-sans">Correct :</span>
        <span className="tracking-wide text-base leading-relaxed">
          {diff.expectedTokens.map((t, i) => (
            <TokenSpan key={i} token={t} />
          ))}
        </span>
      </div>
      <div className="flex gap-3 pt-1 flex-wrap font-sans text-xs text-gray-400">
        <span><span className="bg-red-100 text-red-600 rounded px-1">abc</span> incorrect</span>
        <span><span className="bg-amber-100 text-amber-700 rounded px-1">abc</span> accent</span>
        <span><span className="bg-green-100 text-green-700 rounded px-1">abc</span> manquant / correct</span>
      </div>
    </div>
  );
}
