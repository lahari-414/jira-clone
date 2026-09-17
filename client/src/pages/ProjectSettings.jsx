import { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { projectApi } from '../api/projectApi';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Textarea from '../components/common/Textarea';
import Select from '../components/common/Select';
import Avatar from '../components/common/Avatar';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { userApi } from '../api/userApi';

export default function ProjectSettings() {
  const { project, reloadProject } = useOutletContext();
  const { data: members, reload: reloadMembers } = useApi(() => projectApi.members(project.id), [project.id]);
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: project.name, description: project.description || '' });
  const [saving, setSaving] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const { data: workspaceUsers } = useApi(() => userApi.list({ limit: 100 }), []);

  const canManage = user.role === 'ADMIN' || members?.find((m) => m.userId === user.id && ['OWNER', 'MANAGER'].includes(m.projectRole));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await projectApi.update(project.id, form);
      toast.success('Project updated');
      reloadProject();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update project');
    } finally {
      setSaving(false);
    }
  };

  const archive = async () => {
    try {
      await projectApi.archive(project.id);
      toast.success('Project archived');
      setConfirmArchive(false);
      navigate('/projects');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not archive project');
    }
  };

  return (
    <div className="grid-2">
      <div className="card card-pad">
        <h3 style={{ fontSize: 14, marginBottom: 12 }}>Project details</h3>
        <form onSubmit={save}>
          <div className="field"><label>Name</label><Input disabled={!canManage} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="field"><label>Description</label><Textarea disabled={!canManage} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          {canManage && <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>}
        </form>

        {canManage && (
          <>
            <div className="divider" />
            <div className="flex-row"><Button variant="danger" size="sm" onClick={() => setConfirmArchive(true)}>Complete & archive</Button><Button variant="ghost" size="sm" onClick={() => setConfirmDelete(true)}>Delete project</Button></div>
          </>
        )}
      </div>

      <div className="card card-pad">
        <h3 style={{ fontSize: 14, marginBottom: 12 }}>Members</h3>
        {members?.map((m) => (
          <div className="flex-row" key={m.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <Avatar name={m.user.name} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{m.user.name}</div>
              <div className="text-muted" style={{ fontSize: 11.5 }}>{m.user.email}</div>
            </div>
            {canManage && m.userId !== project.ownerId ? <Select value={m.projectRole} style={{ width: 112 }} onChange={async (event) => { try { await projectApi.updateMember(project.id, m.userId, event.target.value); reloadMembers(); toast.success('Member role updated'); } catch { toast.error('Could not update member role'); } }}><option value="MANAGER">Manager</option><option value="MEMBER">Member</option><option value="VIEWER">Viewer</option></Select> : <span className="text-muted" style={{ fontSize: 12 }}>{m.projectRole}</span>}
            {canManage && m.userId !== project.ownerId && <Button size="sm" variant="ghost" onClick={async () => { try { await projectApi.removeMember(project.id, m.userId); reloadMembers(); toast.success('Member removed'); } catch { toast.error('Could not remove member'); } }}>Remove</Button>}
          </div>
        ))}
        {canManage && (
          <div className="flex-row" style={{ marginTop: 14 }}>
            <Select value={newMemberEmail} onChange={(e) => setNewMemberEmail(e.target.value)}>
              <option value="">Select a workspace user</option>
              {workspaceUsers?.users?.filter((workspaceUser) => !members?.some((member) => member.userId === workspaceUser.id) && workspaceUser.isActive).map((workspaceUser) => <option key={workspaceUser.id} value={workspaceUser.id}>{workspaceUser.name} — {workspaceUser.email}</option>)}
            </Select>
            <Button
              size="sm"
              onClick={async () => {
                try {
                  if (!newMemberEmail) return toast.error('Select a user first');
                  await projectApi.addMember(project.id, { userId: newMemberEmail });
                  setNewMemberEmail('');
                  reloadMembers();
                  toast.success('Member added');
                } catch (err) {
                  toast.error(err.response?.data?.message || 'Could not add member');
                }
              }}
            >
              Add
            </Button>
          </div>
        )}
      </div>

      {confirmArchive && (
        <ConfirmDialog
          title="Archive this project?"
          message="Archived projects become read-only but their data is kept. This can be reversed later by an admin."
          confirmLabel="Archive"
          danger
          onConfirm={archive}
          onCancel={() => setConfirmArchive(false)}
        />
      )}
      {confirmDelete && <ConfirmDialog title="Delete this project?" message="This permanently deletes all project issues, comments, attachments, and activity. This cannot be undone." confirmLabel="Delete project" danger onConfirm={async () => { try { await projectApi.remove(project.id); toast.success('Project deleted'); navigate('/projects'); } catch (err) { toast.error(err.response?.data?.message || 'Could not delete project'); } }} onCancel={() => setConfirmDelete(false)} />}
    </div>
  );
}
