import { useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { issueApi } from '../api/issueApi';
import { projectApi } from '../api/projectApi';
import Spinner from '../components/common/Spinner';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Select from '../components/common/Select';
import CreateIssueModal from '../components/issue/CreateIssueModal';
import { STATUS_LABELS, TYPE_BADGE } from '../utils/format';

export default function ProjectIssues() {
  const { project } = useOutletContext();
  const [filters, setFilters] = useState({ status: '' });
  const { data: issues, loading, error, reload } = useApi(() => issueApi.listByProject(project.id, filters), [project.id, filters.status]);
  const { data: members } = useApi(() => projectApi.members(project.id), [project.id]);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div>
      <div className="flex-row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
        <Select value={filters.status} onChange={(e) => setFilters({ status: e.target.value })} style={{ width: 180 }}>
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
        <Button size="sm" onClick={() => setShowCreate(true)}>+ Add issue</Button>
      </div>

      {loading && <Spinner full />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {!loading && issues?.length === 0 && <EmptyState title="No issues match" />}

      {!loading && issues?.length > 0 && (
        <div className="card">
          <table className="data-table">
            <thead><tr><th>Key</th><th>Title</th><th>Type</th><th>Status</th><th>Priority</th><th>Assignee</th></tr></thead>
            <tbody>
              {issues.map((issue) => (
                <tr key={issue.id}>
                  <td className="text-muted">{issue.key}</td>
                  <td><Link to={`/issues/${issue.id}`}>{issue.title}</Link></td>
                  <td><Badge variant={TYPE_BADGE[issue.issueType]}>{issue.issueType}</Badge></td>
                  <td>{STATUS_LABELS[issue.status]}</td>
                  <td>{issue.priority}</td>
                  <td>{issue.assignee?.name || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <CreateIssueModal projectId={project.id} projectKey={project.key} members={members || []} onClose={() => setShowCreate(false)} onCreated={reload} />
      )}
    </div>
  );
}
