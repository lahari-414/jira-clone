import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../hooks/useApi';
import { dashboardApi } from '../api/dashboardApi';
import Spinner from '../components/common/Spinner';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import Badge from '../components/common/Badge';
import Avatar from '../components/common/Avatar';
import { Link } from 'react-router-dom';
import { STATUS_LABELS, STATUS_BADGE, TYPE_BADGE, PRIORITY_COLORS, timeAgo } from '../utils/format';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';

const STATUS_COLORS = ['#2475e8', '#f5ac31', '#17a789', '#ef5355'];

export default function Dashboard() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useApi(dashboardApi.get, []);

  if (loading) return <Spinner full />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return null;

  const { totals, myIssues, charts, activeSprints, recentActivity, recentComments = [] } = data;

  const statusCounts = charts.byStatus.reduce((counts, item) => {
    const bucket = item.status === 'BACKLOG' || item.status === 'TODO'
      ? 'Open'
      : item.status === 'IN_PROGRESS' || item.status === 'IN_REVIEW'
        ? 'In Progress'
        : item.status === 'DONE'
          ? 'Completed'
          : 'Blocked';
    counts[bucket] = (counts[bucket] || 0) + item._count;
    return counts;
  }, {});
  const statusData = ['Open', 'In Progress', 'Completed', 'Blocked']
    .map((name) => ({ name, value: statusCounts[name] || 0 }));
  const totalStatusIssues = statusData.reduce((total, item) => total + item.value, 0);
  const priorityData = charts.byPriority.map((p) => ({ name: p.priority, value: p._count }));
  const latestActivity = [...recentActivity].slice(0, 6);
  const latestComments = [...recentComments].slice(0, 6);

  return (
    <div>
      <div className="page-header dashboard-hero">
        <div>
          <h1>Welcome back, {user?.name?.split(' ')[0]}</h1>
          <div className="page-subtitle">Here's what's happening across your projects.</div>
        </div>
        <svg className="dashboard-hero-art" viewBox="0 0 190 116" role="img" aria-label="Illustration of a completed task list">
          <path d="M22 108c10-17 8-32 2-47 17 9 24 25 20 47m112 0c-7-18-4-34 8-50 3 19 1 35-5 50" fill="none" stroke="#13a98d" strokeWidth="5" strokeLinecap="round" />
          <path d="M34 83c-14-3-20-11-21-24 14 5 22 12 24 23m119 4c12-10 23-13 35-10-7 12-18 17-32 17" fill="#20b89a" />
          <rect x="43" y="12" width="104" height="92" rx="9" fill="#fff" stroke="#c7d9ed" strokeWidth="2" />
          <path d="M43 21a9 9 0 0 1 9-9h86a9 9 0 0 1 9 9v10H43z" fill="#1c55c7" />
          <rect x="55" y="43" width="12" height="12" rx="3" fill="#2475e8" /><path d="m58 49 2 2 4-5" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="74" y="46" width="53" height="4" rx="2" fill="#d8e3f0" />
          <rect x="55" y="63" width="12" height="12" rx="3" fill="#2475e8" /><path d="m58 69 2 2 4-5" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="74" y="66" width="43" height="4" rx="2" fill="#d8e3f0" />
          <rect x="55" y="83" width="12" height="12" rx="3" fill="#17a789" /><path d="m58 89 2 2 4-5" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="74" y="86" width="49" height="4" rx="2" fill="#d8e3f0" />
          <path d="M34 108h122" stroke="#9bc7df" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>

      <div className="stat-grid">
        <Link to="/projects" className="card stat-card"><span className="stat-icon stat-icon-projects" aria-hidden="true">▱</span><div><div className="num">{totals.totalProjects}</div><div className="label">Projects</div></div></Link>
        <Link to="/search" className="card stat-card"><span className="stat-icon stat-icon-open" aria-hidden="true">▣</span><div><div className="num">{totals.openIssues}</div><div className="label">Open Issues</div></div></Link>
        <Link to="/search?status=DONE" className="card stat-card"><span className="stat-icon stat-icon-complete" aria-hidden="true">✓</span><div><div className="num">{totals.completedIssues}</div><div className="label">Completed Issues</div></div></Link>
        <Link to="/search?priority=HIGH" className="card stat-card"><span className="stat-icon stat-icon-priority" aria-hidden="true">↑</span><div><div className="num">{totals.highPriorityIssues}</div><div className="label">High Priority</div></div></Link>
        <Link to="/my-issues" className="card stat-card"><span className="stat-icon stat-icon-mine" aria-hidden="true">◉</span><div><div className="num">{myIssues.length}</div><div className="label">My Issues</div></div></Link>
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card card-pad status-chart-card">
          <h3>Issues by Status</h3>
          {totalStatusIssues === 0 ? (
            <EmptyState title="No issues yet" />
          ) : (
            <div className="status-chart-layout">
              <div className="status-donut-wrap">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={57} outerRadius={86} paddingAngle={2} stroke="none">
                      {statusData.map((entry, i) => <Cell key={entry.name} fill={STATUS_COLORS[i]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="status-donut-total"><span>Total</span><strong>{totalStatusIssues}</strong></div>
              </div>
              <div className="status-legend">
                {statusData.map((item, i) => <div className="status-legend-item" key={item.name}><span className="status-legend-label"><i style={{ backgroundColor: STATUS_COLORS[i] }} />{item.name}</span><strong>{item.value}</strong></div>)}
              </div>
            </div>
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
                <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                  {priorityData.map((entry) => <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name] || '#3E5AF0'} />)}
                </Bar>
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
          {latestActivity.length === 0 ? (
            <EmptyState title="No activity yet" />
          ) : (
            latestActivity.map((a) => (
              <Link to={`/issues/${a.issue.id}#activity`} key={a.id} className="flex-row dashboard-activity-row">
                <Avatar name={a.user.name} />
                <span style={{ fontSize: 12.5 }}>
                  <strong>{a.user.name}</strong> {a.action.replaceAll('_', ' ').toLowerCase()} on{' '}
                  <strong>{a.issue.project.key}-{a.issue.issueNumber}</strong>
                </span>
                <span className="text-muted" style={{ fontSize: 11, marginLeft: 'auto' }}>{timeAgo(a.createdAt)}</span>
              </Link>
            ))
          )}
        </div>
      </div>

      <div className="card card-pad" style={{ marginTop: 20 }}>
        <h3 style={{ fontSize: 14, marginBottom: 12 }}>Team communication</h3>
        {latestComments.length === 0 ? <EmptyState title="No comments yet" message="Comments added to issues will appear here." /> : latestComments.map((comment) => <Link to={`/issues/${comment.issueId}#activity`} key={comment.id} className="flex-row dashboard-comment-row"><Avatar name={comment.author.name} /><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12.5 }}><strong>{comment.author.name}</strong> commented on <strong>{comment.issue.project.key}-{comment.issue.issueNumber}</strong></div><div className="text-muted dashboard-comment-content">{comment.content}</div></div><span className="text-muted" style={{ fontSize: 11, flexShrink: 0 }}>{timeAgo(comment.createdAt)}</span></Link>)}
      </div>

      {activeSprints.length > 0 && (
        <div className="card card-pad" style={{ marginTop: 20 }}>
          <h3 style={{ fontSize: 14, marginBottom: 12 }}>Active sprints</h3>
          {activeSprints.map((s) => (
            <Link to={`/projects/${s.projectId}/sprints`} key={s.id} className="flex-row" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <Badge variant="blue">{s.project.key}</Badge>
              <span style={{ fontSize: 13, flex: 1 }}>{s.name}</span>
              <span className="text-muted" style={{ fontSize: 12 }}>{s._count.issueLinks} issues</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
