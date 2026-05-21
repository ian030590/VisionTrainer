import { Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { SettingsPage } from './pages/SettingsPage';
import { ExperimentPage } from './pages/ExperimentPage';
import { AssessmentPage } from './pages/AssessmentPage';
import { AcuityTestPage } from './pages/AcuityTestPage';

export function App() {
  return (
    <Routes>
      {/* Full-screen pages, no navbar */}
      <Route path="/experiment" element={<ExperimentPage />} />
      <Route path="/acuity-test" element={<AcuityTestPage />} />

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
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        }
      />
    </Routes>
  );
}
