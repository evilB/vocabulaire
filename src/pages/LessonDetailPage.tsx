import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { Store } from '../hooks/useStore';
import type { Card } from '../types';

interface Props {
  store: Store;
}

/** Convert synonyms array to editable raw string: ["a","b"] → "(a, b)", ["a"] → "a". */
function toEditRaw(primary: string, synonyms?: string[]): string {
  if (synonyms && synonyms.length > 1) return `(${synonyms.join(', ')})`;
  return primary;
}

/** Parse raw edit string into primary + optional synonyms array. */
function parseEditRaw(raw: string): { primary: string; synonyms?: string[] } {
  const t = raw.trim();
  if (t.startsWith('(') && t.endsWith(')')) {
    const syns = t.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean);
    if (syns.length > 1) return { primary: syns[0], synonyms: syns };
    if (syns.length === 1) return { primary: syns[0] };
  }
  return { primary: t };
}

function cardDutchDisplay(card: Card): string {
  return card.dutchSynonyms && card.dutchSynonyms.length > 1
    ? card.dutchSynonyms.join(' / ')
    : card.dutch;
}

function cardFrenchDisplay(card: Card): string {
  return card.frenchSynonyms && card.frenchSynonyms.length > 1
    ? card.frenchSynonyms.join(' / ')
    : card.french;
}

export default function LessonDetailPage({ store }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lessons, cards, renameLesson, addCard, updateCard, deleteCard } = store;

  const lesson = lessons.find((l) => l.id === id);
  const lessonCards = cards.filter((c) => c.lessonId === id);

  const [renaming, setRenaming] = useState(false);
  const [nameInput, setNameInput] = useState(lesson?.name ?? '');
  const [editing, setEditing] = useState<Card | null>(null);
  const [editDutchRaw, setEditDutchRaw] = useState('');
  const [editFrenchRaw, setEditFrenchRaw] = useState('');
  const [newDutch, setNewDutch] = useState('');
  const [newFrench, setNewFrench] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

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

  function handleRename(e: React.FormEvent) {
    e.preventDefault();
    renameLesson(lesson!.id, nameInput.trim() || lesson!.name);
    setRenaming(false);
  }

  function handleAddCard(e: React.FormEvent) {
    e.preventDefault();
    if (!newDutch.trim() || !newFrench.trim()) return;
    const { primary: dutch, synonyms: dutchSynonyms } = parseEditRaw(newDutch);
    const { primary: french, synonyms: frenchSynonyms } = parseEditRaw(newFrench);
    addCard(lesson!.id, dutch, french, dutchSynonyms, frenchSynonyms);
    setNewDutch('');
    setNewFrench('');
  }

  function handleUpdateCard(e: React.FormEvent) {
    e.preventDefault();
    if (!editing || !editDutchRaw.trim() || !editFrenchRaw.trim()) return;
    const { primary: dutch, synonyms: dutchSynonyms } = parseEditRaw(editDutchRaw);
    const { primary: french, synonyms: frenchSynonyms } = parseEditRaw(editFrenchRaw);
    updateCard(editing.id, dutch, french, dutchSynonyms, frenchSynonyms);
    setEditing(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/lessons')}
          className="text-gray-400 hover:text-gray-600 text-xl leading-none"
        >
          ←
        </button>
        {renaming ? (
          <form onSubmit={handleRename} className="flex gap-2 flex-1">
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              autoFocus
              className="flex-1 border border-gray-300 rounded-xl px-3 py-1.5 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <button type="submit" className="text-purple-600 font-semibold text-sm">Enregistrer</button>
            <button type="button" onClick={() => setRenaming(false)} className="text-gray-400 text-sm">Annuler</button>
          </form>
        ) : (
          <h1
            className="text-2xl font-extrabold text-purple-700 flex-1 cursor-pointer hover:underline"
            onClick={() => { setNameInput(lesson.name); setRenaming(true); }}
            title="Cliquer pour renommer"
          >
            {lesson.name}
          </h1>
        )}
        <Link
          to={`/lessons/${lesson.id}/import`}
          className="text-sm bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-xl font-semibold hover:bg-indigo-200 transition-colors"
        >
          📋 Importer
        </Link>
      </div>

      {/* Add card form */}
      <form onSubmit={handleAddCard} className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
        <p className="font-bold text-gray-700 text-sm">Ajouter une carte</p>
        <div className="flex gap-2">
          <input
            value={newDutch}
            onChange={(e) => setNewDutch(e.target.value)}
            placeholder="Néerlandais"
            className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <input
            value={newFrench}
            onChange={(e) => setNewFrench(e.target.value)}
            placeholder="Français"
            className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <button
            type="submit"
            disabled={!newDutch.trim() || !newFrench.trim()}
            className="bg-purple-500 text-white px-4 py-2 rounded-xl font-semibold text-sm hover:bg-purple-600 disabled:opacity-40 transition-colors"
          >
            Ajouter
          </button>
        </div>
      </form>

      {/* Card list */}
      {lessonCards.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm text-gray-400 font-semibold">
            {lessonCards.length} carte{lessonCards.length !== 1 ? 's' : ''}
          </p>
          {lessonCards.map((card) =>
            editing?.id === card.id ? (
              <form
                key={card.id}
                onSubmit={handleUpdateCard}
                className="bg-yellow-50 border border-yellow-200 rounded-2xl p-3 flex gap-2"
              >
                <input
                  value={editDutchRaw}
                  onChange={(e) => setEditDutchRaw(e.target.value)}
                  placeholder="Néerlandais ou (syn1, syn2)"
                  className="flex-1 border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none"
                />
                <input
                  value={editFrenchRaw}
                  onChange={(e) => setEditFrenchRaw(e.target.value)}
                  placeholder="Français ou (syn1, syn2)"
                  className="flex-1 border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none"
                />
                <button type="submit" className="text-purple-600 font-semibold text-sm">Enregistrer</button>
                <button type="button" onClick={() => setEditing(null)} className="text-gray-400 text-sm">✕</button>
              </form>
            ) : (
              <div
                key={card.id}
                className="bg-white rounded-2xl shadow-sm p-3 flex items-center gap-3"
              >
                <span className="flex-1 text-sm font-semibold text-gray-700">{cardDutchDisplay(card)}</span>
                <span className="text-gray-300">→</span>
                <span className="flex-1 text-sm text-gray-600">{cardFrenchDisplay(card)}</span>
                <button
                  onClick={() => {
                    setEditing(card);
                    setEditDutchRaw(toEditRaw(card.dutch, card.dutchSynonyms));
                    setEditFrenchRaw(toEditRaw(card.french, card.frenchSynonyms));
                  }}
                  className="text-gray-300 hover:text-purple-500 transition-colors text-sm"
                  title="Modifier"
                >
                  ✏️
                </button>
                {confirmDelete === card.id ? (
                  <>
                    <button onClick={() => deleteCard(card.id)} className="text-red-500 text-xs font-semibold">Suppr.</button>
                    <button onClick={() => setConfirmDelete(null)} className="text-gray-400 text-xs">✕</button>
                  </>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(card.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors text-xl leading-none"
                  >
                    ×
                  </button>
                )}
              </div>
            ),
          )}
        </div>
      ) : (
        <p className="text-gray-400 text-center py-6">
          Aucune carte. Ajoute-en une ci-dessus ou utilise Importer.
        </p>
      )}
    </div>
  );
}
