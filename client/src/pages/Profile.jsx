import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../api/authApi';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Avatar from '../components/common/Avatar';
import Badge from '../components/common/Badge';
import { useToast } from '../contexts/ToastContext';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: user.name, avatar: user.avatar || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [pwError, setPwError] = useState('');

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await authApi.updateProfile(form);
      refreshUser(updated);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    setSavingPw(true);
    try {
      await authApi.changePassword(pwForm);
      setPwForm({ currentPassword: '', newPassword: '' });
      toast.success('Password updated');
    } catch (err) {
      setPwError(err.response?.data?.message || 'Could not update password');
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div>
      <div className="page-header"><h1>Profile & settings</h1></div>

      <div className="grid-2">
        <div className="card card-pad">
          <div className="flex-row" style={{ marginBottom: 16 }}>
            <Avatar name={user.name} size="lg" />
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{user.name}</div>
              <div className="text-muted" style={{ fontSize: 12.5 }}>{user.email}</div>
              <Badge variant="blue">{user.role.replace('_', ' ')}</Badge>
            </div>
          </div>
          <form onSubmit={saveProfile}>
            <div className="field"><label>Full name</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="field"><label>Avatar URL</label><Input value={form.avatar} onChange={(e) => setForm({ ...form, avatar: e.target.value })} placeholder="https://…" /></div>
            <Button type="submit" disabled={savingProfile}>{savingProfile ? 'Saving…' : 'Save profile'}</Button>
          </form>
        </div>

        <div className="card card-pad">
          <h3 style={{ fontSize: 14, marginBottom: 12 }}>Change password</h3>
          <form onSubmit={savePassword}>
            {pwError && <div className="field-error" style={{ marginBottom: 12 }}>{pwError}</div>}
            <div className="field"><label>Current password</label><Input type="password" required value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} /></div>
            <div className="field"><label>New password</label><Input type="password" required minLength={8} value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} /></div>
            <Button type="submit" disabled={savingPw}>{savingPw ? 'Updating…' : 'Update password'}</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
