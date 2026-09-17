import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <form className="auth-card card card-pad" onSubmit={submit}>
        <div className="auth-brand">
          <span className="mark">AV</span> Amivel Tech
        </div>
        <h1 style={{ fontSize: 19, marginBottom: 4 }}>Sign in</h1>
        <p className="text-muted" style={{ marginTop: 0, marginBottom: 20 }}>
          Track issues, plan sprints, ship work.
        </p>

        {error && <div className="field-error" style={{ marginBottom: 12 }}>{error}</div>}

        <div className="field">
          <label>Email</label>
          <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@company.com" />
        </div>
        <div className="field">
          <label>Password</label>
          <Input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
        </div>

        <Button type="submit" disabled={loading} style={{ width: '100%', marginTop: 6 }}>
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>

        <p className="text-muted" style={{ textAlign: 'center', marginTop: 18, fontSize: 13 }}>
          Need access? Ask a workspace administrator to create your account.
        </p>
      </form>
    </div>
  );
}
