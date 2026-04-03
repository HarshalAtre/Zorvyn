import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { dashboardAPI } from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';
import {
  TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, RefreshCw,
} from 'lucide-react';

const StatCard = ({ label, value, color, Icon, bg }) => (
  <div className="card p-5 flex items-center justify-between">
    <div>
      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${bg}`}>
      <Icon size={20} />
    </div>
  </div>
);

export default function Dashboard() {
  const [summary,  setSummary]  = useState(null);
  const [recent,   setRecent]   = useState([]);
  const [loading,  setLoading]  = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [s, r] = await Promise.all([
        dashboardAPI.summary(),
        dashboardAPI.recent({ limit: 8 }),
      ]);
      setSummary(s.data.summary);
      setRecent(r.data.transactions);
    } catch (_) {
      // silently fail — user sees empty state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Overview of your finances</p>
          </div>
          <button onClick={fetchData} className="btn-ghost" disabled={loading}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total Income"
            value={formatCurrency(summary?.totalIncome ?? 0)}
            color="text-emerald-600 dark:text-emerald-400"
            Icon={TrendingUp}
            bg="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
          />
          <StatCard
            label="Total Expenses"
            value={formatCurrency(summary?.totalExpenses ?? 0)}
            color="text-red-500 dark:text-red-400"
            Icon={TrendingDown}
            bg="bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400"
          />
          <StatCard
            label="Net Balance"
            value={formatCurrency(summary?.netBalance ?? 0)}
            color={(summary?.netBalance ?? 0) >= 0
              ? 'text-brand-600 dark:text-brand-400'
              : 'text-red-500 dark:text-red-400'}
            Icon={Wallet}
            bg="bg-brand-50 dark:bg-brand-600/10 text-brand-600 dark:text-brand-400"
          />
        </div>

        {/* Recent activity */}
        <div className="card">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-semibold text-sm">Recent Activity</h2>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <div className="py-12 text-center text-slate-400 text-sm">Loading…</div>
            ) : recent.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">No transactions yet</div>
            ) : (
              recent.map((tx) => (
                <div key={tx._id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      tx.type === 'income'
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                        : 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400'
                    }`}>
                      {tx.type === 'income'
                        ? <ArrowUpRight size={16} />
                        : <ArrowDownRight size={16} />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{tx.category}</p>
                      <p className="text-xs text-slate-400">{formatDate(tx.date)}</p>
                    </div>
                  </div>
                  <p className={`text-sm font-semibold tabular-nums ${
                    tx.type === 'income'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-500 dark:text-red-400'
                  }`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
