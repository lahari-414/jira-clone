import { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { projectApi } from '../api/projectApi';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Textarea from '../components/common/Textarea';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

export default function ProjectSettings() {
  const { project, reloadProject } = useOutletContext();
  const { data: members } = useApi(() => projectApi.members(project.id), [project.id]);
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: project.name, description: project.description || '' });
  const [saving, setSaving] = useState(false);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const canManage = ['ADMIN', 'HR'].includes(user.role) || members?.find((m) => m.userId === user.id && ['OWNER', 'MANAGER'].includes(m.projectRole));

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

  const complete = async () => {
    try {
      await projectApi.complete(project.id);
      toast.success('Project completed');
      setConfirmComplete(false);
      navigate('/projects');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not complete project');
    }
  };

  return (
    <div className="project-settings-layout">
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
            <div className="flex-row"><Button variant="secondary" size="sm" onClick={() => setConfirmComplete(true)}>Mark completed</Button><Button variant="ghost" size="sm" onClick={() => setConfirmDelete(true)}>Delete project</Button></div>
          </>
        )}
      </div>

      {confirmComplete && (
        <ConfirmDialog
          title="Mark this project completed?"
          message="This project will be marked completed in the project list."
          confirmLabel="Mark completed"
          onConfirm={complete}
          onCancel={() => setConfirmComplete(false)}
        />
      )}
      {confirmDelete && <ConfirmDialog title="Delete this project?" message="This permanently deletes all project issues, comments, attachments, and activity. This cannot be undone." confirmLabel="Delete project" danger onConfirm={async () => { try { await projectApi.remove(project.id); toast.success('Project deleted'); navigate('/projects'); } catch (err) { toast.error(err.response?.data?.message || 'Could not delete project'); } }} onCancel={() => setConfirmDelete(false)} />}
    </div>
  );
}
