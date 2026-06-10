import { useNavigate } from 'react-router-dom';
import type { Store } from '../hooks/useStore';

interface Props {
  store: Store;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('nl-NL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
}

export default function HistoryPage({ store }: Props) {
  const { sessionLogs } = store;
  const navigate = useNavigate();

  const totalSessions = sessionLogs.length;
  const totalCards = sessionLogs.reduce((s, l) => s + l.cardsTrained, 0);
  const totalCorrect = sessionLogs.reduce((s, l) => s + l.correctCount, 0);
  const avgAccuracy =
    totalCards > 0 ? Math.round((totalCorrect / totalCards) * 100) : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-purple-700">📊 Geschiedenis</h1>

      {sessionLogs.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Sessies" value={totalSessions} />
          <StatCard label="Kaarten geoefend" value={totalCards} />
          <StatCard label="Nauwkeurigheid" value={`${avgAccuracy}%`} />
        </div>
      )}

      {sessionLogs.length > 0 ? (
        <div className="space-y-3">
          {sessionLogs.map((log) => {
            const pct =
              log.cardsTrained > 0
                ? Math.round((log.correctCount / log.cardsTrained) * 100)
                : 0;
            return (
              <div key={log.id} className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{log.lessonName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDate(log.date)} · {formatTime(log.date)}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-bold px-2.5 py-0.5 rounded-full ${
                      pct >= 80
                        ? 'bg-green-100 text-green-600'
                        : pct >= 50
                        ? 'bg-yellow-100 text-yellow-600'
                        : 'bg-red-100 text-red-500'
                    }`}
                  >
                    {pct}%
                  </span>
                </div>
                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                  <span>🃏 {log.cardsTrained} kaarten</span>
                  <span>✓ {log.correctCount} goed</span>
                  <span>⏱ {formatDuration(log.duration)}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-4">📭</p>
          <p className="font-semibold">Nog geen sessies.</p>
          <p className="text-sm mt-1">Voltooi een quiz om je geschiedenis hier te zien.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 text-purple-500 font-semibold underline text-sm"
          >
            Ga oefenen!
          </button>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
      <p className="text-2xl font-extrabold text-purple-600">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}
