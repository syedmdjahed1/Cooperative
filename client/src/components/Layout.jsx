import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const linkClass = ({ isActive }) =>
  `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
    isActive ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'
  }`;

export function Layout() {
  const { user, logout, samityCode, setSamityCode, isAdmin, isAccountant } = useAuth();
  const navigate = useNavigate();
  const staff = isAdmin || isAccountant;

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="md:w-56 bg-white border-b md:border-b-0 md:border-r border-slate-200 p-4 shrink-0">
        <div className="font-semibold text-brand-700 text-lg mb-4">Samity CMS</div>
        <label className="block text-xs text-slate-500 mb-1">Samity code</label>
        <input
          className="w-full border border-slate-200 rounded-lg px-2 py-1 text-sm mb-4"
          value={samityCode}
          onChange={(e) => setSamityCode(e.target.value || 'default')}
        />
        <nav className="flex flex-row md:flex-col flex-wrap gap-1">
          {staff && (
            <>
              <NavLink to="/admin" className={linkClass} end>
                Dashboard
              </NavLink>
              <NavLink to="/admin/members" className={linkClass}>
                Members
              </NavLink>
              <NavLink to="/admin/deposits" className={linkClass}>
                Deposits
              </NavLink>
              <NavLink to="/admin/investments" className={linkClass}>
                Investments
              </NavLink>
              <NavLink to="/admin/distributions" className={linkClass}>
                Distributions
              </NavLink>
              <NavLink to="/admin/finance" className={linkClass}>
                Cash / Bank
              </NavLink>
              <NavLink to="/admin/reports" className={linkClass}>
                Reports
              </NavLink>
              {isAdmin && (
                <>
                  <NavLink to="/admin/settings" className={linkClass}>
                    Settings
                  </NavLink>
                  <NavLink to="/admin/activity" className={linkClass}>
                    Activity
                  </NavLink>
                </>
              )}
            </>
          )}
          {user?.role === 'member' && (
            <NavLink to="/me" className={linkClass}>
              My dashboard
            </NavLink>
          )}
        </nav>
        <div className="mt-6 text-xs text-slate-500">
          <div className="font-medium text-slate-700">{user?.email || user?.phone}</div>
          <div className="capitalize">{user?.role}</div>
          <button
            type="button"
            className="mt-2 text-brand-600 font-medium"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
