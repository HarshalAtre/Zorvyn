import { useState, useEffect, useMemo } from 'react';
import Layout from '../components/Layout';
import { dashboardAPI } from '../lib/api';
import { formatCurrency, monthName } from '../lib/utils';
import { BarChart2, PieChart } from 'lucide-react';
import clsx from 'clsx';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const formatAxisValue = (value) => {
  if (value >= 10000000) return `Rs ${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `Rs ${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `Rs ${Math.round(value / 1000)}k`;
  return `Rs ${value}`;
};

export default function Analytics() {
  const [period, setPeriod] = useState('monthly');
  const [categories, setCategories] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      dashboardAPI.byCategory(),
      dashboardAPI.trends({ period, range: 12 }),
    ])
      .then(([c, t]) => {
        setCategories(c.data.categories);
        setTrends(t.data.trends);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  const trendChartData = useMemo(() => {
    const byLabel = new Map();
    trends.forEach((item) => {
      const label = period === 'weekly'
        ? `W${item.week} ${item.year}`
        : `${monthName(item.month)} ${item.year}`;

      if (!byLabel.has(label)) {
        byLabel.set(label, { label, income: 0, expense: 0 });
      }
      byLabel.get(label)[item.type] = item.total;
    });

    return Array.from(byLabel.values()).slice(-12);
  }, [trends, period]);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Financial insights and trends</p>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm">Loading analytics...</div>
        ) : (
          <>
            <div className="card p-5">
              <div className="flex flex-wrap items-center gap-2 mb-5">
                <BarChart2 size={18} className="text-brand-500" />
                <h2 className="font-semibold text-sm">
                  {period === 'weekly' ? 'Weekly Trends' : 'Monthly Trends'}
                </h2>
                <select
                  className="ml-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                </select>
                <div className="ml-auto flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" />Income</span>
                  <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-full bg-red-400" />Expense</span>
                </div>
              </div>

              {trendChartData.length === 0 ? (
                <p className="text-center text-slate-400 text-sm py-8">No trend data yet</p>
              ) : (
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendChartData} margin={{ top: 8, right: 10, left: 4, bottom: 0 }}>
                      <defs>
                        <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f87171" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#f87171" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>

                      <CartesianGrid strokeDasharray="3 3" stroke="#33415533" vertical={false} />
                      <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        dy={8}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        tickFormatter={formatAxisValue}
                        width={74}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: '1px solid #334155',
                          borderRadius: '10px',
                          fontSize: '12px',
                        }}
                        labelStyle={{ color: '#f8fafc', fontWeight: 600 }}
                        itemStyle={{ color: '#cbd5e1' }}
                        formatter={(value, name) => [formatCurrency(Number(value)), name === 'income' ? 'Income' : 'Expense']}
                      />

                      <Area
                        type="monotone"
                        dataKey="expense"
                        stroke="#f87171"
                        strokeWidth={2}
                        fill="url(#expenseGradient)"
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="income"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="url(#incomeGradient)"
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="card p-5">
              <div className="flex items-center gap-2 mb-5">
                <PieChart size={18} className="text-brand-500" />
                <h2 className="font-semibold text-sm">Category Breakdown</h2>
              </div>
              {categories.length === 0 ? (
                <p className="text-center text-slate-400 text-sm py-8">No data yet</p>
              ) : (
                <div className="space-y-2">
                  {categories.map((item, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <div>
                        <p className="text-sm font-medium">{item.category}</p>
                        <p className="text-xs text-slate-400">
                          {item.count} transaction{item.count !== 1 ? 's' : ''} - <span className="capitalize">{item.type}</span>
                        </p>
                      </div>
                      <p className={clsx('text-sm font-semibold tabular-nums',
                        item.type === 'income'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-500 dark:text-red-400')}>
                        {formatCurrency(item.total)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
