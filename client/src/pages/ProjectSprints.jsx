import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { sprintApi } from '../api/sprintApi';
import Spinner from '../components/common/Spinner';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Textarea from '../components/common/Textarea';
import { useToast } from '../contexts/ToastContext';
import { formatDate } from '../utils/format';

const STATUS_VARIANT = { PLANNED: 'grey', ACTIVE: 'blue', COMPLETED: 'green', CANCELLED: 'red' };

export default function ProjectSprints() {
  const { project } = useOutletContext();
  const { data: sprints, loading, error, reload } = useApi(() => sprintApi.listByProject(project.id), [project.id]);
  const [showCreate, setShowCreate] = useState(false);
  const toast = useToast();

  const transition = async (fn, id, label) => {
    try {
      await fn(id);
      toast.success(label);
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  return (
    <div>
      <div className="flex-row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
        <h3 style={{ fontSize: 14 }}>Sprints</h3>
        <Button size="sm" onClick={() => setShowCreate(true)}>+ New sprint</Button>
      </div>

      {loading && <Spinner full />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {!loading && sprints?.length === 0 && (
        <EmptyState title="No sprints yet" message="Create a sprint to start planning work." action={<Button size="sm" onClick={() => setShowCreate(true)}>+ New sprint</Button>} />
      )}

      {!loading && sprints?.map((s) => (
        <div className="card card-pad" key={s.id} style={{ marginBottom: 12 }}>
          <div className="flex-row" style={{ justifyContent: 'space-between' }}>
            <div>
              <div className="flex-row"><strong>{s.name}</strong><Badge variant={STATUS_VARIANT[s.status]}>{s.status}</Badge></div>
              {s.goal && <div className="text-muted" style={{ fontSize: 12.5, marginTop: 4 }}>{s.goal}</div>}
              <div className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>
                {formatDate(s.startDate)} → {formatDate(s.endDate)}
              </div>
            </div>
            <div className="flex-row">
              {s.status === 'PLANNED' && <Button size="sm" onClick={() => transition(sprintApi.start, s.id, 'Sprint started')}>Start</Button>}
              {s.status === 'ACTIVE' && <Button size="sm" variant="secondary" onClick={() => transition(sprintApi.complete, s.id, 'Sprint completed')}>Complete</Button>}
              {(s.status === 'PLANNED' || s.status === 'ACTIVE') && (
                <Button size="sm" variant="ghost" onClick={() => transition(sprintApi.cancel, s.id, 'Sprint cancelled')}>Cancel</Button>
              )}
            </div>
          </div>
        </div>
      ))}

      {showCreate && <CreateSprintModal projectId={project.id} onClose={() => setShowCreate(false)} onCreated={reload} />}
    </div>
  );
}

function CreateSprintModal({ projectId, onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', goal: '', startDate: '', endDate: '' });
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await sprintApi.create(projectId, form);
      toast.success('Sprint created');
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create sprint');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="New sprint" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit} disabled={saving}>{saving ? 'Creating…' : 'Create sprint'}</Button></>}>
      <form onSubmit={submit}>
        <div className="field"><label>Name</label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Sprint 2" /></div>
        <div className="field"><label>Goal</label><Textarea value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} placeholder="What should this sprint achieve?" /></div>
        <div className="grid-2">
          <div className="field"><label>Start date</label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
          <div className="field"><label>End date</label><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
        </div>
      </form>
    </Modal>
  );
}
