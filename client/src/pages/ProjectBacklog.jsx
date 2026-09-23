import { useOutletContext } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { issueApi } from '../api/issueApi';
import Spinner from '../components/common/Spinner';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import Badge from '../components/common/Badge';
import { TYPE_BADGE } from '../utils/format';
import { Link } from 'react-router-dom';

export default function ProjectBacklog() {
  const { project } = useOutletContext();
  const { data: issues, loading, error, reload } = useApi(() => issueApi.backlog(project.id), [project.id]);

  return (
    <div>
      <div className="flex-row" style={{ justifyContent: 'space-between', marginBottom: 14 }}><h3 style={{ fontSize: 14 }}>Backlog</h3><span className="text-muted" style={{ fontSize: 12 }}>All TODO / unstarted work</span></div>

      {loading && <Spinner full />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {!loading && issues?.length === 0 && (
        <EmptyState title="Backlog is empty" message="TODO issues automatically appear here." />
      )}

      {!loading && issues?.length > 0 && (
        <div className="card">
          <table className="data-table">
            <thead><tr><th>Key</th><th>Title</th><th>Type</th><th>Priority</th><th>Assignee</th></tr></thead>
            <tbody>
              {issues.map((issue) => (
                <tr key={issue.id}>
                  <td className="text-muted">{issue.key}</td>
                  <td><Link to={`/issues/${issue.id}`}>{issue.title}</Link></td>
                  <td><Badge variant={TYPE_BADGE[issue.issueType]}>{issue.issueType}</Badge></td>
                  <td>{issue.priority}</td>
                  <td>{issue.assignee?.name || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
