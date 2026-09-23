import { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { userApi } from '../../api/userApi';
import Spinner from '../../components/common/Spinner';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/common/Badge';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import Avatar from '../../components/common/Avatar';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useToast } from '../../contexts/ToastContext';

const ROLES = ['ADMIN', 'HR', 'PROJECT_MANAGER', 'DEVELOPER', 'TESTER', 'VIEWER'];

export default function AdminUsers() {
  const [showDeleted, setShowDeleted] = useState(false);
  const { data, loading, error, reload } = useApi(() => userApi.list({ deleted: showDeleted }), [showDeleted]);
  const toast = useToast();
  const [savingId, setSavingId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);

  const changeRole = async (id, role) => {
    setSavingId(id);
    try {
      await userApi.update(id, { role });
      toast.success('Role updated');
      reload();
    } catch (err) {
      toast.error('Could not update role');
    } finally {
      setSavingId(null);
    }
  };

  const toggleActive = async (id, isActive) => {
    setSavingId(id);
    try {
      await userApi.setStatus(id, !isActive);
      toast.success(isActive ? 'User deactivated' : 'User activated');
      reload();
    } catch (err) {
      toast.error('Could not update user status');
    } finally {
      setSavingId(null);
    }
  };

  const deleteUser = async () => {
    if (!deletingUser) return;
    setSavingId(deletingUser.id);
    try {
      await userApi.delete(deletingUser.id);
      toast.success('User moved to Deleted Users');
      setDeletingUser(null);
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete user');
    } finally {
      setSavingId(null);
    }
  };

  const restoreUser = async (user) => {
    setSavingId(user.id);
    try {
      await userApi.restore(user.id);
      toast.success('User restored to Users');
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not restore user');
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <Spinner full />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div>
      <div className="page-header">
        <div><h1>Users</h1><div className="page-subtitle">Administrators and HR can create, edit, and manage workspace accounts.</div></div>
        {!showDeleted && <Button onClick={() => setShowCreate(true)}>+ Create user</Button>}
      </div>
      <div className="tabs admin-user-tabs">
        <button type="button" className={`tab ${!showDeleted ? 'active' : ''}`} onClick={() => setShowDeleted(false)}>Users</button>
        <button type="button" className={`tab ${showDeleted ? 'active' : ''}`} onClick={() => setShowDeleted(true)}>Deleted Users</button>
      </div>
      {data.users.length === 0 ? <EmptyState title={showDeleted ? 'No deleted users' : 'No users found'} /> : <div className="card admin-users-card"><table className="data-table admin-users-table">
        <thead><tr><th>User</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
        <tbody>
          {data.users.map((u) => (
            <tr key={u.id}>
              <td>
                <div className="flex-row">
                  <Avatar name={u.name} />
                  <div>
                    <div style={{ fontWeight: 500 }}>{u.name}</div>
                    <div className="text-muted" style={{ fontSize: 11.5 }}>{u.email}</div>
                  </div>
                </div>
              </td>
              <td>
                <Select value={u.role} disabled={savingId === u.id} onChange={(e) => changeRole(u.id, e.target.value)} style={{ width: 160 }}>
                  {ROLES.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                </Select>
              </td>
              <td><Badge variant={u.isDeleted ? 'violet' : u.isActive ? 'green' : 'red'}>{u.isDeleted ? 'Deleted' : u.isActive ? 'Active' : 'Inactive'}</Badge></td>
              <td className="text-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
              <td className="admin-user-actions">
                <Button size="sm" variant="secondary" disabled={savingId === u.id} onClick={() => setEditingUser(u)} style={{ marginRight: 6 }}>Edit</Button>
                {showDeleted ? (
                  <Button size="sm" variant="secondary" disabled={savingId === u.id} onClick={() => restoreUser(u)}>Restore</Button>
                ) : <>
                  <Button size="sm" variant={u.isActive ? 'danger' : 'secondary'} disabled={savingId === u.id} onClick={() => toggleActive(u.id, u.isActive)}>
                    {u.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button size="sm" variant="danger" disabled={savingId === u.id} onClick={() => setDeletingUser(u)} style={{ marginLeft: 6 }}>Delete</Button>
                </>}
              </td>
            </tr>
          ))}
        </tbody>
      </table></div>}
      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} onCreated={reload} />}
      {editingUser && <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onSaved={reload} />}
      {deletingUser && <ConfirmDialog title="Move this user to Deleted Users?" message={`${deletingUser.name} (${deletingUser.email}) will be removed from the Users list and moved to Deleted Users. Their current active or deactivated state and project/issue history will be preserved. They cannot sign in while deleted.`} confirmLabel="Delete user" danger onConfirm={deleteUser} onCancel={() => setDeletingUser(null)} />}
    </div>
  );
}

function EditUserModal({ user, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({ name: user.name, email: user.email, role: user.role });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true); setError('');
    try {
      await userApi.update(user.id, form);
      toast.success('User details updated');
      onSaved(); onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update user details');
    } finally { setSaving(false); }
  };

  return <Modal title="Edit user details" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button></>}>
    <form onSubmit={submit}>
      {error && <div className="field-error" style={{ marginBottom: 12 }}>{error}</div>}
      <div className="field"><label>Full name</label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
      <div className="field"><label>Email</label><Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
      <div className="field"><label>Workspace role</label><Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>{ROLES.map((role) => <option key={role} value={role}>{role.replace('_', ' ')}</option>)}</Select></div>
    </form>
  </Modal>;
}

function CreateUserModal({ onClose, onCreated }) {
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'DEVELOPER' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true); setError('');
    try {
      await userApi.create(form);
      toast.success('User account created');
      onCreated(); onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create user');
    } finally { setSaving(false); }
  };

  return <Modal title="Create workspace user" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit} disabled={saving}>{saving ? 'Creating…' : 'Create user'}</Button></>}>
    <form onSubmit={submit}>
      {error && <div className="field-error" style={{ marginBottom: 12 }}>{error}</div>}
      <div className="field"><label>Full name</label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Priya Sharma" /></div>
      <div className="field"><label>Email</label><Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="priya@company.com" /></div>
      <div className="field"><label>Temporary password</label><Input required minLength={8} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters" /></div>
      <div className="field"><label>Workspace role</label><Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>{ROLES.map((role) => <option key={role} value={role}>{role.replace('_', ' ')}</option>)}</Select></div>
    </form>
  </Modal>;
}
