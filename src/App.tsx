import { Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/home';
import { SettingsPage } from './pages/settings';
import { TrainingPage } from './pages/training';
import { AssessmentPage } from './pages/assessment';
import { AcuityTestPage } from './pages/assessment';
import { ContrastTestPage } from './pages/assessment/ContrastTestPage';
import { CreditsPage } from './pages/credits';

export function App() {
  return (
    <Routes>
      {/* Full-screen pages, no navbar */}
      <Route path="/training" element={<TrainingPage />} />
      <Route path="/acuity-test" element={<AcuityTestPage />} />
      <Route path="/contrast-test" element={<ContrastTestPage />} />

      {/* Normal pages with navbar */}
      <Route
        path="*"
        element={
          <div className="app-layout">
            <Navbar />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/assessment" element={<AssessmentPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/credits" element={<CreditsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        }
      />
    </Routes>
  );
}
