import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../hooks/useApi';
import { searchApi } from '../api/searchApi';
import Spinner from '../components/common/Spinner';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import Badge from '../components/common/Badge';
import { STATUS_LABELS, STATUS_BADGE, TYPE_BADGE } from '../utils/format';

export default function MyIssues() {
  const { user } = useAuth();
  const { data: issues, loading, error, reload } = useApi(() => searchApi.issues({ assigneeId: user?.id }), [user?.id]);
  if (loading) return <Spinner full />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  return <div>
    <div className="page-header"><div><h1>My issues</h1><div className="page-subtitle">Work currently assigned to you across all projects.</div></div></div>
    {!issues?.length ? <EmptyState title="Nothing assigned to you" /> : <div className="card"><table className="data-table"><thead><tr><th>Key</th><th>Title</th><th>Project</th><th>Type</th><th>Status</th><th>Priority</th><th>Assignee</th><th>Reporter</th><th>Assigned by</th><th>Sprint(s)</th></tr></thead><tbody>{issues.map((issue) => <tr key={issue.id}><td className="text-muted">{issue.key}</td><td><Link to={`/issues/${issue.id}`}>{issue.title}</Link></td><td>{issue.project.name}</td><td><Badge variant={TYPE_BADGE[issue.issueType]}>{issue.issueType}</Badge></td><td><Badge variant={STATUS_BADGE[issue.status]}>{STATUS_LABELS[issue.status]}</Badge></td><td>{issue.priority}</td><td>{issue.assignee?.name || '—'}</td><td>{issue.reporter?.name || '—'}</td><td>{issue.assignedBy?.name || '—'}</td><td>{(issue.sprints || issue.sprintLinks?.map(({ sprint }) => sprint) || []).map((s) => s.name).join(', ') || '—'}</td></tr>)}</tbody></table></div>}
  </div>;
}
