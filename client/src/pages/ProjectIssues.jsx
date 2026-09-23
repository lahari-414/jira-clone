import { useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { issueApi } from '../api/issueApi';
import { projectApi } from '../api/projectApi';
import { sprintApi } from '../api/sprintApi';
import Spinner from '../components/common/Spinner';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import Badge from '../components/common/Badge';
import Select from '../components/common/Select';
import { STATUS_LABELS, STATUS_BADGE, TYPE_BADGE } from '../utils/format';

export default function ProjectIssues() {
  const { project } = useOutletContext();
  const [filters, setFilters] = useState({ status: '', priority: '', issueType: '', assigneeId: '', reporterId: '', assignedById: '', sprintId: '' });
  const { data: issues, loading, error, reload } = useApi(() => issueApi.listByProject(project.id, filters), [project.id, JSON.stringify(filters)]);
  const { data: members } = useApi(() => projectApi.members(project.id), [project.id]);
  const { data: sprints } = useApi(() => sprintApi.listByProject(project.id), [project.id]);
  const setFilter = (key) => (e) => setFilters((current) => ({ ...current, [key]: e.target.value }));

  return (
    <div>
      <div className="flex-row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
        <Select value={filters.status} onChange={setFilter('status')} style={{ width: 150 }}>
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
        <Select value={filters.priority} onChange={setFilter('priority')} style={{ width: 135 }}><option value="">All priorities</option>{['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((p) => <option key={p}>{p}</option>)}</Select>
        <Select value={filters.issueType} onChange={setFilter('issueType')} style={{ width: 130 }}><option value="">All types</option>{['TASK', 'BUG', 'STORY', 'EPIC', 'IMPROVEMENT'].map((t) => <option key={t}>{t}</option>)}</Select>
        <Select value={filters.assigneeId} onChange={setFilter('assigneeId')} style={{ width: 150 }}><option value="">All assignees</option>{members?.map((m) => <option key={m.user.id} value={m.user.id}>{m.user.name}</option>)}</Select>
        <Select value={filters.reporterId} onChange={setFilter('reporterId')} style={{ width: 150 }}><option value="">All reporters</option>{members?.map((m) => <option key={m.user.id} value={m.user.id}>{m.user.name}</option>)}</Select>
        <Select value={filters.assignedById} onChange={setFilter('assignedById')} style={{ width: 150 }}><option value="">All assigners</option>{members?.map((m) => <option key={m.user.id} value={m.user.id}>{m.user.name}</option>)}</Select>
        <Select value={filters.sprintId} onChange={setFilter('sprintId')} style={{ width: 150 }}><option value="">All sprints</option>{sprints?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>
      </div>

      {loading && <Spinner full />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {!loading && issues?.length === 0 && <EmptyState title="No issues match" />}

      {!loading && issues?.length > 0 && (
        <div className="card">
          <table className="data-table">
            <thead><tr><th>Key</th><th>Title</th><th>Project</th><th>Type</th><th>Status</th><th>Priority</th><th>Assignee</th><th>Reporter</th><th>Assigned by</th><th>Sprint(s)</th></tr></thead>
            <tbody>
              {issues.map((issue) => (
                <tr key={issue.id}>
                  <td className="text-muted">{issue.key}</td>
                  <td><Link to={`/issues/${issue.id}`}>{issue.title}</Link></td>
                  <td>{issue.project?.name || project.name}</td>
                  <td><Badge variant={TYPE_BADGE[issue.issueType]}>{issue.issueType}</Badge></td>
                  <td><Badge variant={STATUS_BADGE[issue.status]}>{STATUS_LABELS[issue.status]}</Badge></td>
                  <td>{issue.priority}</td>
                  <td>{issue.assignee?.name || '—'}</td>
                  <td>{issue.reporter?.name || '—'}</td>
                  <td>{issue.assignedBy?.name || '—'}</td>
                  <td>{issue.sprints?.map((s) => s.name).join(', ') || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
