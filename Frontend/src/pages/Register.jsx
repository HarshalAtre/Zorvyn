import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Wallet } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const navigate      = useNavigate();
  const [form, setForm]   = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-600 shadow-lg shadow-brand-600/30">
            <Wallet size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold">Zorvyn</span>
        </div>

        <div className="card p-8">
          <h1 className="text-xl font-bold mb-1">Create account</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Start managing your finances</p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { id: 'name',     label: 'Full name',    type: 'text',     placeholder: 'Alice Smith' },
              { id: 'email',    label: 'Email',         type: 'email',    placeholder: 'you@example.com' },
              { id: 'password', label: 'Password',      type: 'password', placeholder: '********' },
            ].map(({ id, label, type, placeholder }) => (
              <div key={id}>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  {label}
                </label>
                <input
                  id={id}
                  type={type}
                  className="input"
                  placeholder={placeholder}
                  value={form[id]}
                  onChange={set(id)}
                  required
                  minLength={id === 'password' ? 6 : undefined}
                />
              </div>
            ))}
            <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
