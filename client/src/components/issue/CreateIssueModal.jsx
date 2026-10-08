import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import Textarea from '../common/Textarea';
import Select from '../common/Select';
import { issueApi } from '../../api/issueApi';
import { useToast } from '../../contexts/ToastContext';
import { useApi } from '../../hooks/useApi';

export default function CreateIssueModal({ projectId, projectKey, members = [], initialSprintId = '', allowBacklog = false, onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', description: '', issueType: 'TASK', priority: 'MEDIUM', status: 'TODO', assigneeId: '', sprintIds: initialSprintId ? [initialSprintId] : [], dueDate: '' });
  const { data: labels } = useApi(() => issueApi.labels(projectId), [projectId]);
  const [labelIds, setLabelIds] = useState([]);
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
      await Promise.all(labelIds.map((labelId) => issueApi.attachLabel(issue.id, labelId)));
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
          <Button onClick={submit} disabled={saving || (!initialSprintId && !allowBacklog)}>{saving ? 'Creating…' : 'Create issue'}</Button>
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
        <div className="field"><label>Due date</label><Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></div>
        <div className="field">
          <label>Assignee</label>
          <Select value={form.assigneeId} onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}>
            <option value="">Unassigned</option>
            {members.map((m) => <option key={m.user.id} value={m.user.id}>{m.user.name}</option>)}
          </Select>
        </div>
        <div className="helper-text">{allowBacklog ? 'This issue will be created in the project backlog.' : 'This issue will be created inside the selected sprint.'}</div>
        <div className="field"><label>Labels</label><select className="select" multiple value={labelIds} onChange={(e) => setLabelIds([...e.target.selectedOptions].map((option) => option.value))} style={{ minHeight: 68 }}>{labels?.map((label) => <option key={label.id} value={label.id}>{label.name}</option>)}</select></div>
        <div className="field"><label>Attachments / uploads</label><Input type="file" multiple onChange={(e) => setFiles([...e.target.files])} /><div className="helper-text">Optional: screenshots, logs, or test evidence (10 MB each).</div></div>
      </form>
    </Modal>
  );
}
