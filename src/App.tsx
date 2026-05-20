import { Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { SettingsPage } from './pages/SettingsPage';
import { ExperimentPage } from './pages/ExperimentPage';

export function App() {
  return (
    <Routes>
      {/* Experiment page is full-screen, no navbar */}
      <Route path="/experiment" element={<ExperimentPage />} />

      {/* Normal pages with navbar */}
      <Route
        path="*"
        element={
          <div className="app-layout">
            <Navbar />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        }
      />
    </Routes>
  );
}
