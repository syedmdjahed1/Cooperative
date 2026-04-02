import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
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

function RequireAuth() {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function RequireStaff() {
  const { user } = useAuth();
  if (user?.role === 'member') return <Navigate to="/me" replace />;
  return <Outlet />;
}

function RequireMember() {
  const { user } = useAuth();
  if (user?.role !== 'member') return <Navigate to="/admin" replace />;
  return <Outlet />;
}

function HomeRedirect() {
  const { user } = useAuth();
  if (user?.role === 'member') return <Navigate to="/me" replace />;
  return <Navigate to="/admin" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route path="/" element={<HomeRedirect />} />
          <Route element={<RequireStaff />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/members" element={<Members />} />
            <Route path="/admin/deposits" element={<Deposits />} />
            <Route path="/admin/investments" element={<Investments />} />
            <Route path="/admin/distributions" element={<Distributions />} />
            <Route path="/admin/finance" element={<Finance />} />
            <Route path="/admin/reports" element={<Reports />} />
            <Route path="/admin/settings" element={<Settings />} />
            <Route path="/admin/activity" element={<Activity />} />
          </Route>
          <Route element={<RequireMember />}>
            <Route path="/me" element={<MemberDashboard />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
