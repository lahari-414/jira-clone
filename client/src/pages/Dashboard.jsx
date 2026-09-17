import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../hooks/useApi';
import { dashboardApi } from '../api/dashboardApi';
import Spinner from '../components/common/Spinner';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import Badge from '../components/common/Badge';
import Avatar from '../components/common/Avatar';
import { Link } from 'react-router-dom';
import { STATUS_LABELS, TYPE_BADGE, timeAgo } from '../utils/format';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';

const COLORS = ['#3E5AF0', '#D98A2B', '#C63B4B', '#1F8A5F', '#7A4FD1'];

export default function Dashboard() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useApi(dashboardApi.get, []);

  if (loading) return <Spinner full />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return null;

  const { totals, myIssues, charts, activeSprints, recentActivity, recentComments = [] } = data;

  const statusData = charts.byStatus.map((s) => ({ name: STATUS_LABELS[s.status], value: s._count }));
  const priorityData = charts.byPriority.map((p) => ({ name: p.priority, value: p._count }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Welcome back, {user?.name?.split(' ')[0]}</h1>
          <div className="page-subtitle">Here's what's happening across your projects.</div>
        </div>
      </div>

      <div className="stat-grid">
        <div className="card stat-card"><div className="num">{totals.totalProjects}</div><div className="label">Projects</div></div>
        <div className="card stat-card"><div className="num">{totals.openIssues}</div><div className="label">Open issues</div></div>
        <div className="card stat-card"><div className="num">{totals.completedIssues}</div><div className="label">Completed issues</div></div>
        <div className="card stat-card"><div className="num">{totals.highPriorityIssues}</div><div className="label">High priority</div></div>
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card card-pad">
          <h3 style={{ fontSize: 14, marginBottom: 12 }}>Issues by status</h3>
          {statusData.length === 0 ? (
            <EmptyState title="No issues yet" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75}>
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="card card-pad">
          <h3 style={{ fontSize: 14, marginBottom: 12 }}>Issues by priority</h3>
          {priorityData.length === 0 ? (
            <EmptyState title="No issues yet" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={priorityData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#3E5AF0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid-2">
        <div className="card card-pad">
          <h3 style={{ fontSize: 14, marginBottom: 12 }}>My assigned issues</h3>
          {myIssues.length === 0 ? (
            <EmptyState title="Nothing assigned to you" message="Issues assigned to you will show up here." />
          ) : (
            myIssues.map((issue) => (
              <Link to={`/issues/${issue.id}`} key={issue.id} className="flex-row" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <Badge variant={TYPE_BADGE[issue.issueType]}>{issue.issueType}</Badge>
                <span style={{ fontSize: 13, flex: 1 }}>{issue.title}</span>
                <span className="text-muted" style={{ fontSize: 12 }}>{issue.project.key}-{issue.issueNumber}</span>
              </Link>
            ))
          )}
        </div>

        <div className="card card-pad">
          <h3 style={{ fontSize: 14, marginBottom: 12 }}>Recent activity</h3>
          {recentActivity.length === 0 ? (
            <EmptyState title="No activity yet" />
          ) : (
            recentActivity.map((a) => (
              <div key={a.id} className="flex-row" style={{ padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                <Avatar name={a.user.name} />
                <span style={{ fontSize: 12.5 }}>
                  <strong>{a.user.name}</strong> {a.action.replaceAll('_', ' ').toLowerCase()} on{' '}
                  <Link to={`/issues/${a.issue.id}`}>{a.issue.project.key}-{a.issue.issueNumber}</Link>
                </span>
                <span className="text-muted" style={{ fontSize: 11, marginLeft: 'auto' }}>{timeAgo(a.createdAt)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card card-pad" style={{ marginTop: 20 }}>
        <h3 style={{ fontSize: 14, marginBottom: 12 }}>Team communication</h3>
        {recentComments.length === 0 ? <EmptyState title="No comments yet" message="Comments added to issues will appear here." /> : recentComments.map((comment) => <Link to={`/issues/${comment.issueId}`} key={comment.id} className="flex-row" style={{ padding: '9px 0', borderBottom: '1px solid var(--border)', alignItems: 'flex-start' }}><Avatar name={comment.author.name} /><div style={{ flex: 1 }}><div style={{ fontSize: 12.5 }}><strong>{comment.author.name}</strong> commented on <strong>{comment.issue.project.key}-{comment.issue.issueNumber}</strong></div><div className="text-muted" style={{ fontSize: 12, marginTop: 2 }}>{comment.content}</div></div><span className="text-muted" style={{ fontSize: 11 }}>{timeAgo(comment.createdAt)}</span></Link>)}
      </div>

      {activeSprints.length > 0 && (
        <div className="card card-pad" style={{ marginTop: 20 }}>
          <h3 style={{ fontSize: 14, marginBottom: 12 }}>Active sprints</h3>
          {activeSprints.map((s) => (
            <Link to={`/projects/${s.projectId}/sprints`} key={s.id} className="flex-row" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <Badge variant="blue">{s.project.key}</Badge>
              <span style={{ fontSize: 13, flex: 1 }}>{s.name}</span>
              <span className="text-muted" style={{ fontSize: 12 }}>{s._count.issues} issues</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
