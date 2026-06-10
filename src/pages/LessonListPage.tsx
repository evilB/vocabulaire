import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Store } from '../hooks/useStore';
import { exportBackup, parseBackupFile } from '../lib/storage';

interface Props {
  store: Store;
}

export default function LessonListPage({ store }: Props) {
  const { lessons, cards, progress, addLesson, deleteLesson, importBackup } = store;
  const navigate = useNavigate();
  const [newName, setNewName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    const lesson = addLesson(name);
    setNewName('');
    navigate(`/lessons/${lesson.id}`);
  }

  function handleExport() {
    exportBackup(lessons, cards, progress);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await parseBackupFile(file);
      importBackup(data);
      const lessonCount = data.lessons.length;
      const cardCount = data.cards.length;
      setImportStatus({ type: 'success', msg: `${lessonCount} lessen en ${cardCount} kaarten geïmporteerd.` });
    } catch (err) {
      setImportStatus({ type: 'error', msg: (err as Error).message });
    }
    // Reset file input so the same file can be re-imported if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-purple-700">📚 Lessen</h1>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            disabled={lessons.length === 0}
            className="text-sm bg-indigo-100 text-indigo-700 font-semibold px-3 py-1.5 rounded-xl hover:bg-indigo-200 disabled:opacity-40 transition-colors"
            title="Exporteer alle lessen als JSON"
          >
            ⬇ Exporteren
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-sm bg-green-100 text-green-700 font-semibold px-3 py-1.5 rounded-xl hover:bg-green-200 transition-colors"
            title="Importeer lessen uit JSON bestand"
          >
            ⬆ Importeren
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleImport}
          />
        </div>
      </div>

      {importStatus && (
        <div
          className={`rounded-2xl px-4 py-3 text-sm font-semibold flex items-center justify-between ${
            importStatus.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-600 border border-red-200'
          }`}
        >
          <span>{importStatus.type === 'success' ? '✅ ' : '❌ '}{importStatus.msg}</span>
          <button onClick={() => setImportStatus(null)} className="ml-4 opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Naam nieuwe les…"
          className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
        <button
          type="submit"
          disabled={!newName.trim()}
          className="bg-purple-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-purple-600 disabled:opacity-40 transition-colors"
        >
          Aanmaken
        </button>
      </form>

      {lessons.length > 0 ? (
        <div className="space-y-3">
          {lessons.map((lesson) => {
            const count = cards.filter((c) => c.lessonId === lesson.id).length;
            return (
              <div
                key={lesson.id}
                className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3"
              >
                <button
                  className="flex-1 text-left"
                  onClick={() => navigate(`/lessons/${lesson.id}`)}
                >
                  <p className="font-bold text-gray-800">{lesson.name}</p>
                  <p className="text-sm text-gray-400">
                    {count} kaart{count !== 1 ? 'en' : ''}
                  </p>
                </button>
                {confirmDelete === lesson.id ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => deleteLesson(lesson.id)}
                      className="text-red-600 font-semibold text-sm"
                    >
                      Verwijderen
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="text-gray-400 text-sm"
                    >
                      Annuleren
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(lesson.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors text-xl leading-none"
                    title="Les verwijderen"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-gray-400 text-center py-8">Nog geen lessen. Maak er één aan hierboven!</p>
      )}
    </div>
  );
}
