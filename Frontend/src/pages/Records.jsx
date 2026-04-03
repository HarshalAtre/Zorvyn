import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { transactionsAPI } from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Edit2, Trash2, X, Search } from 'lucide-react';
import clsx from 'clsx';

const OTHER_CATEGORY_VALUE = '__other__';
const PAGE_SIZE = 10;
const CATEGORY_OPTIONS = {
  income: ['Salary', 'Freelance', 'Investment', 'Bonus', 'Business', 'Other Income'],
  expense: ['Food', 'Rent', 'Transport', 'Utilities', 'Healthcare', 'Entertainment', 'Other Expense'],
};

const EMPTY_FORM = {
  amount: '',
  type: 'income',
  category: '',
  date: new Date().toISOString().split('T')[0],
  notes: '',
};

export default function Records() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [data, setData] = useState({ transactions: [], total: 0, page: 1, limit: PAGE_SIZE });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: '', category: '', search: '' });
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [categorySelect, setCategorySelect] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: PAGE_SIZE };
      if (filters.type) params.type = filters.type;
      if (filters.category) params.category = filters.category;
      if (filters.search) params.search = filters.search;

      const { data: res } = await transactionsAPI.getAll(params);
      const normalized = {
        transactions: Array.isArray(res.transactions) ? res.transactions : [],
        total: Number(res.total) || 0,
        page: Number(res.page) || page,
        limit: Number(res.limit) || PAGE_SIZE,
      };

      const nextTotalPages = Math.max(1, Math.ceil(normalized.total / normalized.limit));
      if (normalized.page > nextTotalPages) {
        setPage(nextTotalPages);
        return;
      }

      setData(normalized);
    } catch (_) {
      setData((prev) => ({ ...prev, transactions: [] }));
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const currentPage = data.page || page;
  const currentLimit = data.limit || PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil((data.total || 0) / currentLimit));
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;
  const rangeStart = data.total > 0 ? ((currentPage - 1) * currentLimit) + 1 : 0;
  const rangeEnd = Math.min(currentPage * currentLimit, data.total || 0);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setCategorySelect('');
    setError('');
    setModal(true);
  };

  const openEdit = (tx) => {
    const options = CATEGORY_OPTIONS[tx.type] || [];
    const isPresetCategory = options.includes(tx.category);

    setEditing(tx);
    setForm({
      amount: tx.amount,
      type: tx.type,
      category: tx.category,
      date: new Date(tx.date).toISOString().split('T')[0],
      notes: tx.notes || '',
    });
    setCategorySelect(isPresetCategory ? tx.category : OTHER_CATEGORY_VALUE);
    setError('');
    setModal(true);
  };

  const handleTypeChange = (nextType) => {
    const options = CATEGORY_OPTIONS[nextType] || [];
    setForm((prev) => {
      if (categorySelect === OTHER_CATEGORY_VALUE) {
        return { ...prev, type: nextType };
      }
      const nextCategory = options.includes(prev.category) ? prev.category : '';
      if (!nextCategory) setCategorySelect('');
      return { ...prev, type: nextType, category: nextCategory };
    });
  };

  const handleCategorySelectChange = (value) => {
    setCategorySelect(value);
    if (value === OTHER_CATEGORY_VALUE) {
      const presetOptions = CATEGORY_OPTIONS[form.type] || [];
      if (presetOptions.includes(form.category)) {
        setForm((prev) => ({ ...prev, category: '' }));
      }
      return;
    }
    setForm((prev) => ({ ...prev, category: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (editing) {
        await transactionsAPI.update(editing._id, form);
      } else {
        await transactionsAPI.create(form);
      }
      setModal(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this transaction?')) return;
    try {
      await transactionsAPI.remove(id);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <Layout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Records</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {data.total} transaction{data.total !== 1 ? 's' : ''}
            </p>
          </div>
          {isAdmin && (
            <button onClick={openCreate} className="btn-primary" id="btn-add-record">
              <Plus size={16} /> Add record
            </button>
          )}
        </div>

        <div className="card p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-8"
              placeholder="Search notes / category..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
            />
          </div>
          <select
            className="input"
            value={filters.type}
            onChange={(e) => updateFilter('type', e.target.value)}
          >
            <option value="">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <input
            className="input"
            placeholder="Filter by category..."
            value={filters.category}
            onChange={(e) => updateFilter('category', e.target.value)}
          />
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                  {['Date', 'Category', 'Notes', 'Type', 'Amount', isAdmin && 'Actions']
                    .filter(Boolean)
                    .map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr><td colSpan={isAdmin ? 6 : 5} className="py-12 text-center text-slate-400">Loading...</td></tr>
                ) : data.transactions.length === 0 ? (
                  <tr><td colSpan={isAdmin ? 6 : 5} className="py-12 text-center text-slate-400">No records found</td></tr>
                ) : data.transactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(tx.date)}</td>
                    <td className="px-4 py-3 font-medium">{tx.category}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs max-w-[180px] truncate">{tx.notes || '-'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={clsx(
                          'badge',
                          tx.type === 'income'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                            : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                        )}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td
                      className={clsx(
                        'px-4 py-3 font-semibold tabular-nums',
                        tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
                      )}
                    >
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(tx)} className="btn-ghost p-1.5" title="Edit">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDelete(tx._id)} className="btn-danger p-1.5" title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {!loading && data.total > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-slate-500">
            <p>Showing {rangeStart}-{rangeEnd} of {data.total}</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn-ghost px-3 py-1.5"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={!canGoPrev}
              >
                Prev
              </button>
              <span className="min-w-[90px] text-center">Page {currentPage} / {totalPages}</span>
              <button
                type="button"
                className="btn-ghost px-3 py-1.5"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={!canGoNext}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold">{editing ? 'Edit Record' : 'New Record'}</h2>
              <button onClick={() => setModal(false)} className="btn-ghost p-1.5"><X size={16} /></button>
            </div>

            {error && <p className="mb-4 text-xs text-red-500">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { label: 'Amount', key: 'amount', type: 'number', placeholder: '0', step: '0.01' },
                { label: 'Date', key: 'date', type: 'date' },
                { label: 'Notes', key: 'notes', type: 'text', placeholder: 'Optional...' },
              ].map(({ label, key, ...rest }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">{label}</label>
                  <input
                    className="input"
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    required={key !== 'notes'}
                    {...rest}
                  />
                </div>
              ))}

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Type</label>
                <select className="input" value={form.type} onChange={(e) => handleTypeChange(e.target.value)}>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Category</label>
                <select
                  className="input"
                  value={categorySelect}
                  onChange={(e) => handleCategorySelectChange(e.target.value)}
                  required
                >
                  <option value="" disabled>Select category</option>
                  {(CATEGORY_OPTIONS[form.type] || []).map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                  <option value={OTHER_CATEGORY_VALUE}>Other</option>
                </select>
              </div>

              {categorySelect === OTHER_CATEGORY_VALUE && (
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Custom category</label>
                  <input
                    className="input"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="Enter category"
                    required
                  />
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button type="submit" className="btn-primary flex-1" disabled={saving}>
                  {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
                </button>
                <button type="button" className="btn-ghost" onClick={() => setModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
