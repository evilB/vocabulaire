import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { Store } from '../hooks/useStore';

interface Props {
  store: Store;
}

interface ParsedPair {
  dutch: string;
  french: string;
}

function parsePaste(text: string): ParsedPair[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const sep = line.includes('\t') ? '\t' : ',';
      const parts = line.split(sep).map((s) => s.trim());
      return { dutch: parts[0] ?? '', french: parts[1] ?? '' };
    })
    .filter((p) => p.dutch && p.french);
}

export default function ImportPage({ store }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lessons, addCards } = store;

  const lesson = lessons.find((l) => l.id === id);
  const [raw, setRaw] = useState('');
  const [preview, setPreview] = useState<ParsedPair[] | null>(null);
  const [imported, setImported] = useState(false);

  if (!lesson) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p>Leçon introuvable.</p>
        <Link to="/lessons" className="text-purple-500 underline mt-2 block">
          Retour aux leçons
        </Link>
      </div>
    );
  }

  function handlePreview() {
    setPreview(parsePaste(raw));
  }

  function handleImport() {
    if (!preview?.length) return;
    addCards(lesson!.id, preview);
    setImported(true);
  }

  if (imported) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-5xl">🎉</p>
        <p className="text-xl font-bold text-purple-700">
          {preview!.length} carte{preview!.length !== 1 ? 's' : ''} importée{preview!.length !== 1 ? 's' : ''} !
        </p>
        <button
          onClick={() => navigate(`/lessons/${lesson.id}`)}
          className="bg-purple-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-purple-600 transition-colors"
        >
          Retour à {lesson.name}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`/lessons/${lesson.id}`)}
          className="text-gray-400 hover:text-gray-600 text-xl"
        >
          ←
        </button>
        <h1 className="text-2xl font-extrabold text-purple-700">
          📋 Importer dans « {lesson.name} »
        </h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
        <p className="text-sm text-gray-600">
          Colle des paires de mots néerlandais-français — une par ligne, séparées par une{' '}
          <strong>tabulation</strong> ou une <strong>virgule</strong>.
        </p>
        <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-400 font-mono">
          hond{'\t'}chien
          <br />
          kat,chat
          <br />
          school{'\t'}école
        </div>
        <textarea
          value={raw}
          onChange={(e) => { setRaw(e.target.value); setPreview(null); }}
          rows={10}
          placeholder="Colle tes paires de mots ici…"
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-400 resize-y"
        />
        <button
          onClick={handlePreview}
          disabled={!raw.trim()}
          className="bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-600 disabled:opacity-40 transition-colors"
        >
          Aperçu
        </button>
      </div>

      {preview !== null && (
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          {preview.length === 0 ? (
            <p className="text-red-500 text-sm">Aucune paire valide trouvée. Vérifie le format.</p>
          ) : (
            <>
              <p className="font-bold text-gray-700">
                {preview.length} paire{preview.length !== 1 ? 's' : ''} trouvée{preview.length !== 1 ? 's' : ''}
              </p>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {preview.map((p, i) => (
                  <div key={i} className="flex gap-3 text-sm py-1.5 border-b border-gray-100 last:border-0">
                    <span className="flex-1 font-semibold text-gray-700">{p.dutch}</span>
                    <span className="text-gray-300">→</span>
                    <span className="flex-1 text-gray-600">{p.french}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={handleImport}
                className="bg-purple-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-purple-600 transition-colors"
              >
                ✅ Importer {preview.length} carte{preview.length !== 1 ? 's' : ''}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
