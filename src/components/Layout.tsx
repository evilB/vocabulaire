import { Link, useLocation } from 'react-router-dom';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();

  const nav = [
    { to: '/', label: '🏠 Accueil' },
    { to: '/lessons', label: '📚 Leçons' },
    { to: '/history', label: '📊 Historique' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-blue-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-6">
          <span className="text-xl font-extrabold text-purple-600 mr-auto">🦊 Flashcards</span>
          {nav.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`text-sm font-semibold px-3 py-1.5 rounded-full transition-colors ${
                pathname === to
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-500 hover:text-purple-600'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
