import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useStore } from './hooks/useStore';
import Layout from './components/Layout';
import WelcomeScreen from './components/WelcomeScreen';
import HomePage from './pages/HomePage';
import LessonListPage from './pages/LessonListPage';
import LessonDetailPage from './pages/LessonDetailPage';
import ImportPage from './pages/ImportPage';
import QuizPage from './pages/QuizPage';
import HistoryPage from './pages/HistoryPage';

export default function App() {
  const store = useStore();

  if (!store.userName) {
    return <WelcomeScreen onSave={store.setUserName} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Layout>
              <HomePage store={store} />
            </Layout>
          }
        />
        <Route
          path="/lessons"
          element={
            <Layout>
              <LessonListPage store={store} />
            </Layout>
          }
        />
        <Route
          path="/lessons/:id"
          element={
            <Layout>
              <LessonDetailPage store={store} />
            </Layout>
          }
        />
        <Route
          path="/lessons/:id/import"
          element={
            <Layout>
              <ImportPage store={store} />
            </Layout>
          }
        />
        <Route
          path="/quiz"
          element={
            <Layout>
              <QuizPage store={store} />
            </Layout>
          }
        />
        <Route
          path="/history"
          element={
            <Layout>
              <HistoryPage store={store} />
            </Layout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
