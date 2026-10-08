import { NavLink, Outlet, useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { projectApi } from '../api/projectApi';
import Spinner from '../components/common/Spinner';
import ErrorState from '../components/common/ErrorState';
import Badge from '../components/common/Badge';

const tabs = [
  { to: '', label: 'Board', end: true },
  { to: 'backlog', label: 'Backlog' },
  { to: 'sprints', label: 'Sprints' },
  { to: 'issues', label: 'All issues' },
  { to: 'settings', label: 'Settings' },
];

export default function ProjectLayout() {
  const { projectId } = useParams();
  const { data: project, loading, error, reload } = useApi(() => projectApi.get(projectId), [projectId]);

  if (loading) return <Spinner full />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!project) return null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="flex-row">{project.name} <Badge variant="blue">{project.key}</Badge></h1>
          {project.description && <div className="page-subtitle">{project.description}</div>}
        </div>
      </div>

      <div className="tabs">
        {tabs.map((t) => (
          <NavLink
            key={t.label}
            to={t.to}
            end={t.end}
            className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}
          >
            {t.label}
          </NavLink>
        ))}
      </div>

      <Outlet context={{ project, reloadProject: reload }} />
    </div>
  );
}
