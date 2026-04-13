import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AdminDashboard } from './pages/AdminDashboard';
import { MemberDashboard } from './pages/MemberDashboard';
import { Members } from './pages/Members';
import { Deposits } from './pages/Deposits';
import { Investments } from './pages/Investments';
import { Distributions } from './pages/Distributions';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { Finance } from './pages/Finance';
import { Activity } from './pages/Activity';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/members" element={<Members />} />
        <Route path="/admin/deposits" element={<Deposits />} />
        <Route path="/admin/investments" element={<Investments />} />
        <Route path="/admin/distributions" element={<Distributions />} />
        <Route path="/admin/finance" element={<Finance />} />
        <Route path="/admin/reports" element={<Reports />} />
        <Route path="/admin/settings" element={<Settings />} />
        <Route path="/admin/activity" element={<Activity />} />
        <Route path="/me" element={<MemberDashboard />} />
      </Route>
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
