import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import Textarea from '../common/Textarea';
import Select from '../common/Select';
import { issueApi } from '../../api/issueApi';
import { sprintApi } from '../../api/sprintApi';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../../contexts/ToastContext';

export default function CreateIssueModal({ projectId, projectKey, members = [], onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', description: '', issueType: 'TASK', priority: 'MEDIUM', status: 'TODO', assigneeId: '', sprintIds: [] });
  const { data: sprints } = useApi(() => sprintApi.listByProject(projectId), [projectId]);
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const issue = await issueApi.create(projectId, { ...form, assigneeId: form.assigneeId || undefined });
      await Promise.all(files.map((file) => issueApi.uploadAttachment(issue.id, file)));
      toast.success('Issue created');
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create issue');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Create issue"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? 'Creating…' : 'Create issue'}</Button>
        </>
      }
    >
      <form onSubmit={submit}>
        {error && <div className="field-error" style={{ marginBottom: 12 }}>{error}</div>}
        <div className="field"><label>Project key</label><Input disabled value={projectKey || 'Current project'} /></div>
        <div className="field">
          <label>Title</label>
          <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Short, specific summary" />
        </div>
        <div className="field">
          <label>Description</label>
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Add more detail (optional)" />
        </div>
        <div className="grid-2">
          <div className="field">
            <label>Type</label>
            <Select value={form.issueType} onChange={(e) => setForm({ ...form, issueType: e.target.value })}>
              {['TASK', 'BUG', 'STORY', 'EPIC', 'IMPROVEMENT'].map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </div>
          <div className="field">
            <label>Status</label>
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="TODO">To Do</option><option value="IN_PROGRESS">In Progress</option><option value="BLOCKED">Blocked</option><option value="ON_HOLD">On Hold</option><option value="DONE">Done</option>
            </Select>
          </div>
          <div className="field">
            <label>Priority</label>
            <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'HIGHEST'].map((t) => <option key={t} value={t}>{t === 'HIGHEST' ? 'Critical (legacy)' : t}</option>)}
            </Select>
          </div>
        </div>
        <div className="field">
          <label>Assignee</label>
          <Select value={form.assigneeId} onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}>
            <option value="">Unassigned</option>
            {members.map((m) => <option key={m.user.id} value={m.user.id}>{m.user.name}</option>)}
          </Select>
        </div>
        <div className="field"><label>Sprints</label><select className="select" multiple value={form.sprintIds} onChange={(e) => setForm({ ...form, sprintIds: [...e.target.selectedOptions].map((o) => o.value) })} style={{ minHeight: 90 }}>{sprints?.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.status})</option>)}</select><div className="helper-text">Select zero, one, or multiple sprints.</div></div>
        <div className="field"><label>Attachments / uploads</label><Input type="file" multiple onChange={(e) => setFiles([...e.target.files])} /><div className="helper-text">Optional: screenshots, logs, or test evidence (10 MB each).</div></div>
      </form>
    </Modal>
  );
}
