import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { TrainingPage } from './pages/training/TrainingPage';
import { AssessmentPage } from './pages/assessment/AssessmentPage';
import { AcuityTestPage } from './pages/assessment/AcuityTestPage';
import { ContrastTestPage } from './pages/assessment/ContrastTestPage';
import { CreditsPage } from './pages/credits/CreditsPage';

export function App() {
  return (
    <Routes>
      <Route path="/training" element={<TrainingPage />} />
      <Route path="/acuity-test" element={<AcuityTestPage />} />
      <Route path="/contrast-test" element={<ContrastTestPage />} />

      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/assessment" element={<AssessmentPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/credits" element={<CreditsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function AppLayout() {
  return (
    <div className="app-layout">
      <Navbar />
      <Outlet />
    </div>
  );
}
