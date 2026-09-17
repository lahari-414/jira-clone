import { useApi } from '../../hooks/useApi';
import { adminApi } from '../../api/adminApi';
import Spinner from '../../components/common/Spinner';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import Avatar from '../../components/common/Avatar';
import { timeAgo } from '../../utils/format';
import { Link } from 'react-router-dom';

export default function AdminAuditLogs() {
  const { data: log, loading, error, reload } = useApi(adminApi.auditLog, []);
  if (loading) return <Spinner full />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!log?.length) return <EmptyState title="No activity recorded yet" />;

  return (
    <div className="card card-pad">
      {log.map((a) => (
        <div key={a.id} className="flex-row" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
          <Avatar name={a.user.name} />
          <span style={{ fontSize: 12.5 }}>
            <strong>{a.user.name}</strong> {a.action.replaceAll('_', ' ').toLowerCase()} on{' '}
            <Link to={`/issues/${a.issue.id}`}>{a.issue.project.key}-{a.issue.issueNumber}</Link>
          </span>
          <span className="text-muted" style={{ fontSize: 11, marginLeft: 'auto' }}>{timeAgo(a.createdAt)}</span>
        </div>
      ))}
    </div>
  );
}
