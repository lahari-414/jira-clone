import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <form className="auth-card card card-pad" onSubmit={submit}>
        <div className="auth-brand">
          <span className="mark">A</span> Atlas
        </div>
        <h1 style={{ fontSize: 19, marginBottom: 4 }}>Create your account</h1>
        <p className="text-muted" style={{ marginTop: 0, marginBottom: 20 }}>
          The first account created becomes the workspace admin.
        </p>

        {error && <div className="field-error" style={{ marginBottom: 12 }}>{error}</div>}

        <div className="field">
          <label>Full name</label>
          <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jordan Lee" />
        </div>
        <div className="field">
          <label>Email</label>
          <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@company.com" />
        </div>
        <div className="field">
          <label>Password</label>
          <Input type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters" />
        </div>

        <Button type="submit" disabled={loading} style={{ width: '100%', marginTop: 6 }}>
          {loading ? 'Creating account…' : 'Create account'}
        </Button>

        <p className="text-muted" style={{ textAlign: 'center', marginTop: 18, fontSize: 13 }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--accent-600)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </form>
    </div>
  );
}
