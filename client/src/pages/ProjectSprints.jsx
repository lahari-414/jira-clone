import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
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

const STATUS_VARIANT = { FUTURE: 'grey', ACTIVE: 'blue', COMPLETED: 'green', CANCELLED: 'red' };

export default function ProjectSprints() {
  const { project } = useOutletContext();
  const { data, loading, error, reload } = useApi(() => sprintApi.backlog(project.id), [project.id]);
  const [showCreate, setShowCreate] = useState(false);
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState({});
  const toast = useToast();
  useEffect(() => {
    const timer = setInterval(reload, 30_000);
    return () => clearInterval(timer);
  }, [reload]);

  const transition = async (fn, id, label) => {
    try { await fn(id); toast.success(label); reload(); }
    catch (err) { toast.error(err.response?.data?.message || 'Action failed'); }
  };

  return <div className="sprint-backlog-page">
    <div className="sprint-backlog-title"><div><h2>Sprints</h2><p>Plan work and follow issues through each sprint.</p></div><Button size="sm" onClick={() => setShowCreate(true)}>+ Create sprint</Button></div>
    <div className="sprint-backlog-toolbar"><label className="sprint-search"><span aria-hidden="true">⌕</span><Input aria-label="Filter sprint issues" placeholder="Filter issues" value={query} onChange={(e) => setQuery(e.target.value)} /></label><Link className="btn btn-secondary btn-sm" to={`/projects/${project.id}/backlog`}>Backlog</Link></div>
    {loading && <Spinner full />}
    {error && <ErrorState message={error} onRetry={reload} />}
    {!loading && !error && !data?.sprints?.length && <EmptyState title="No sprints yet" message="Create a sprint to plan project issues." action={<Button size="sm" onClick={() => setShowCreate(true)}>+ Create sprint</Button>} />}
    {!loading && data?.sprints?.map((sprint) => {
      const filtered = (sprint.issues || []).filter((issue) => `${issue.key} ${issue.title} ${issue.assignee?.name || ''}`.toLowerCase().includes(query.toLowerCase()));
      const done = sprint.issues?.filter((issue) => issue.status === 'DONE').length || 0;
      const isCollapsed = Boolean(collapsed[sprint.id]);
      return <section className="card sprint-backlog-section" key={sprint.id}>
        <header className="sprint-backlog-section-head">
          <button className="sprint-collapse-toggle" type="button" aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${sprint.name}`} onClick={() => setCollapsed((current) => ({ ...current, [sprint.id]: !current[sprint.id] }))}>{isCollapsed ? '›' : '⌄'}</button>
          <div className="sprint-backlog-summary"><div className="sprint-backlog-name-line"><Link to={`/projects/${project.id}/sprints/${sprint.id}`}>{sprint.name}</Link><span>{filtered.length} of {sprint.issues?.length || 0} issues</span><Badge variant={STATUS_VARIANT[sprint.status]}>{sprint.status === 'FUTURE' ? 'PLANNED' : sprint.status}</Badge></div>
            <div className="sprint-backlog-dates">{sprint.startDate ? new Date(sprint.startDate).toLocaleString() : 'Start not set'} · {sprint.endDate ? new Date(sprint.endDate).toLocaleString() : 'End not set'}</div>
          </div>
          <div className="sprint-backlog-actions"><Link className="btn btn-ghost btn-sm" to={`/projects/${project.id}/sprints/${sprint.id}`}>Open board</Link>{sprint.status === 'FUTURE' && <Button size="sm" disabled={Boolean(sprint.endDate && new Date(sprint.endDate).getTime() <= Date.now())} onClick={() => transition(sprintApi.start, sprint.id, 'Sprint started')}>Start</Button>}{sprint.status === 'ACTIVE' && <Button size="sm" variant="secondary" onClick={() => transition(sprintApi.complete, sprint.id, 'Sprint completed')}>Complete</Button>}</div>
        </header>
        {!isCollapsed && <><div className="sprint-backlog-progress"><span>{done} complete</span><div><i style={{ width: `${sprint.issues?.length ? done / sprint.issues.length * 100 : 0}%` }} /></div></div>
          {filtered.length ? <div className="sprint-issue-rows">{filtered.map((issue) => <Link className="sprint-issue-row" to={`/issues/${issue.id}`} key={issue.id}><span className="sprint-issue-type" title={issue.issueType}>{issue.issueType === 'BUG' ? '◆' : '▣'}</span><span className="sprint-issue-key">{issue.key}</span><span className="sprint-issue-title">{issue.title}</span><span className="sprint-issue-assignee">{issue.assignee?.name || 'Unassigned'}</span><Badge variant={issue.status === 'DONE' ? 'green' : issue.status === 'IN_PROGRESS' ? 'blue' : 'grey'}>{issue.status.replaceAll('_', ' ')}</Badge></Link>)}</div> : <div className="sprint-issue-empty">{query ? 'No matching issues in this sprint.' : 'No issues in this sprint yet.'}</div>}
        </>}
      </section>;
    })}
    {showCreate && <CreateSprintModal projectId={project.id} onClose={() => setShowCreate(false)} onCreated={reload} />}
  </div>;
}

function CreateSprintModal({ projectId, onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', goal: '', startDate: '', startTime: '', endDate: '', endTime: '' });
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.startDate || !form.startTime || !form.endDate || !form.endTime) { toast.error('Complete all sprint fields'); return; }
    setSaving(true);
    try { await sprintApi.create(projectId, { ...form, startDate: new Date(`${form.startDate}T${form.startTime}`).toISOString(), endDate: new Date(`${form.endDate}T${form.endTime}`).toISOString() }); toast.success('Sprint created'); onCreated(); onClose(); }
    catch (err) { toast.error(err.response?.data?.message || 'Could not create sprint'); }
    finally { setSaving(false); }
  };
  return <Modal title="New sprint" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit} disabled={saving}>{saving ? 'Creating…' : 'Create sprint'}</Button></>}>
    <form onSubmit={submit}><div className="field"><label>Name</label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Sprint 2" /></div>
      <div className="field"><label>Goal</label><Textarea value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} placeholder="What should this sprint achieve?" /></div>
      <div className="grid-2"><div className="field"><label>Start date</label><Input required type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div><div className="field"><label>Start time</label><Input required type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></div><div className="field"><label>End date</label><Input required type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div><div className="field"><label>End time</label><Input required type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} /></div></div>
    </form>
  </Modal>;
}
