import { useApi } from '../hooks/useApi';
import { notificationApi } from '../api/notificationApi';
import Spinner from '../components/common/Spinner';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import Button from '../components/common/Button';
import { timeAgo } from '../utils/format';
import { Link } from 'react-router-dom';

export default function Notifications() {
  const { data, loading, error, reload } = useApi(notificationApi.list, []);

  const markAllRead = async () => {
    await notificationApi.markAllRead();
    reload();
  };

  if (loading) return <Spinner full />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const { notifications, unreadCount } = data;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Notifications</h1>
          <div className="page-subtitle">{unreadCount} unread</div>
        </div>
        {unreadCount > 0 && <Button variant="secondary" size="sm" onClick={markAllRead}>Mark all as read</Button>}
      </div>

      {notifications.length === 0 && <EmptyState title="You're all caught up" />}

      {notifications.map((n) => (
        <div
          key={n.id}
          className="card card-pad"
          style={{ marginBottom: 8, borderLeft: n.isRead ? undefined : '3px solid var(--accent-500)' }}
          onClick={() => !n.isRead && notificationApi.markRead(n.id).then(reload)}
        >
          <div className="flex-row" style={{ justifyContent: 'space-between' }}><div style={{ fontSize: 13, fontWeight: 650 }}>{n.title}</div><span className={`badge ${n.issueId ? 'badge-blue' : 'badge-violet'}`}>{n.issueId ? 'Issue' : 'Project'}</span></div>
          <div style={{ fontSize: 13, color: 'var(--ink-700)', margin: '2px 0' }}>{n.message}</div>
          <div className="flex-row" style={{ justifyContent: 'space-between' }}>
            <span className="text-muted" style={{ fontSize: 11.5 }}>{timeAgo(n.createdAt)}</span>
            {n.issueId && <Link to={`/issues/${n.issueId}`} style={{ fontSize: 12, color: 'var(--accent-600)' }}>View issue</Link>}
          </div>
        </div>
      ))}
    </div>
  );
}
