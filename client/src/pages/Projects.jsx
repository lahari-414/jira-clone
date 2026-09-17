import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { projectApi } from '../api/projectApi';
import Spinner from '../components/common/Spinner';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Textarea from '../components/common/Textarea';
import { useToast } from '../contexts/ToastContext';

export default function Projects() {
  const { data: projects, loading, error, reload } = useApi(projectApi.list, []);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Projects</h1>
          <div className="page-subtitle">All projects you're a member of.</div>
        </div>
        <Button onClick={() => setShowCreate(true)}>+ New project</Button>
      </div>

      {loading && <Spinner full />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !error && projects?.length === 0 && (
        <EmptyState
          title="No projects yet"
          message="Create your first project to start tracking issues."
          action={<Button onClick={() => setShowCreate(true)}>+ New project</Button>}
        />
      )}

      {!loading && projects?.length > 0 && (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr><th>Project</th><th>Key</th><th>Status</th><th>Created</th></tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id}>
                  <td><Link to={`/projects/${p.id}`} style={{ fontWeight: 600 }}>{p.name}</Link></td>
                  <td><Badge variant="blue">{p.key}</Badge></td>
                  <td><Badge variant={p.status === 'ACTIVE' ? 'green' : 'grey'}>{p.status}</Badge></td>
                  <td className="text-muted">{new Date(p.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} onCreated={reload} />}
    </div>
  );
}

function CreateProjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', key: '', description: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      await projectApi.create(form);
      toast.success('Project created');
      onCreated();
      onClose();
    } catch (err) {
      const details = err.response?.data?.errors;
      const msg = details?.[0]?.msg || err.response?.data?.message || 'Could not create project';
      setErrors({ form: msg });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="New project"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? 'Creating…' : 'Create project'}</Button>
        </>
      }
    >
      <form onSubmit={submit}>
        {errors.form && <div className="field-error" style={{ marginBottom: 12 }}>{errors.form}</div>}
        <div className="field">
          <label>Project name</label>
          <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Atlas Platform Rebuild" />
        </div>
        <div className="field">
          <label>Project key</label>
          <Input required value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value.toUpperCase() })} placeholder="PROJ" maxLength={10} />
          <div className="helper-text">2–10 characters. Start with a letter; numbers and hyphens are allowed, e.g. WEB-01.</div>
        </div>
        <div className="field">
          <label>Description</label>
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What is this project about?" />
        </div>
      </form>
    </Modal>
  );
}
