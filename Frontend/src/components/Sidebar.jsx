import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard, Receipt, TrendingUp, Users,
  LogOut, Moon, Sun, Wallet,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import clsx from 'clsx';

const NAV = [
  { path: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/records',    icon: Receipt,          label: 'Records',   roles: ['analyst','admin'] },
  { path: '/analytics', icon: TrendingUp,        label: 'Analytics', roles: ['analyst','admin'] },
  { path: '/users',     icon: Users,             label: 'Users',     roles: ['admin'] },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate  = useNavigate();
  const [dark, setDark] = useState(
    () => document.documentElement.classList.contains('dark')
  );

  const toggleTheme = () => {
    const next = !dark;
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    setDark(next);
  };

  const visible = NAV.filter(
    (n) => !n.roles || n.roles.includes(user?.role)
  );

  return (
    <aside className="flex flex-col h-screen w-60 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-600">
          <Wallet size={16} className="text-white" />
        </div>
        <span className="font-semibold text-base tracking-tight">FinanceOS</span>
      </div>

      {/* User chip */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl bg-slate-50 dark:bg-slate-800">
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-xs text-white font-semibold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate">{user?.name}</p>
            <p className="text-[10px] text-slate-500 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visible.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={clsx('nav-link', active && 'active')}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer actions */}
      <div className="px-3 py-4 border-t border-slate-100 dark:border-slate-800 space-y-0.5">
        <button onClick={toggleTheme} className="btn-ghost w-full justify-start">
          {dark ? <Sun size={18} /> : <Moon size={18} />}
          {dark ? 'Light mode' : 'Dark mode'}
        </button>
        <button
          onClick={async () => { await logout(); navigate('/login'); }}
          className="btn-danger w-full justify-start"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
