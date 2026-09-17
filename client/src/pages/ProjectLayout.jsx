import { NavLink, Outlet, useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { projectApi } from '../api/projectApi';
import Spinner from '../components/common/Spinner';
import ErrorState from '../components/common/ErrorState';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import CreateIssueModal from '../components/issue/CreateIssueModal';

const tabs = [
  { to: '', label: 'Board', end: true },
  { to: 'backlog', label: 'Backlog' },
  { to: 'sprints', label: 'Sprints' },
  { to: 'issues', label: 'All issues' },
  { to: 'settings', label: 'Settings' },
];

export default function ProjectLayout() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { data: project, loading, error, reload } = useApi(() => projectApi.get(projectId), [projectId]);
  const { data: members } = useApi(() => projectApi.members(projectId), [projectId]);
  const [showCreateIssue, setShowCreateIssue] = useState(false);

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
        <Button onClick={() => setShowCreateIssue(true)}>+ Create issue</Button>
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
      {showCreateIssue && <CreateIssueModal projectId={project.id} projectKey={project.key} members={members || []} onClose={() => setShowCreateIssue(false)} onCreated={() => { setShowCreateIssue(false); navigate(`/projects/${project.id}/issues`); }} />}
    </div>
  );
}
