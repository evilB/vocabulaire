interface Props {
  value: number; // 0–1
  label?: string;
  color?: string;
}

export default function ProgressBar({ value, label, color = 'bg-purple-500' }: Props) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        {label && <span>{label}</span>}
        <span className="ml-auto">{pct}%</span>
      </div>
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
