import { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { issueApi } from '../api/issueApi';
import { sprintApi } from '../api/sprintApi';
import { projectApi } from '../api/projectApi';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Spinner from '../components/common/Spinner';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import CreateIssueModal from '../components/issue/CreateIssueModal';
import { useToast } from '../contexts/ToastContext';

export default function ProjectBacklog() {
  const { project } = useOutletContext();
  const { data: issues, loading, error, reload } = useApi(() => issueApi.backlog(project.id), [project.id]);
  const { data: sprints } = useApi(() => sprintApi.listByProject(project.id), [project.id]);
  const { data: members } = useApi(() => projectApi.members(project.id), [project.id]);
  const [create, setCreate] = useState(false);
  const toast = useToast();
  const futureSprints = (sprints || []).filter((sprint) => sprint.status === 'FUTURE' && (!sprint.endDate || new Date(sprint.endDate).getTime() > Date.now()));
  const moveIssueToSprint = async (sprintId, event) => {
    event.preventDefault();
    const issueId = event.dataTransfer.getData('text/plain');
    if (!issueId) return;
    try { await issueApi.update(issueId, { sprintId }); await reload(); toast.success('Issue moved to sprint'); }
    catch (err) { toast.error(err.response?.data?.message || 'Could not move issue'); }
  };
  if (loading) return <Spinner full />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  return <div className="project-backlog">
    <div className="sprint-backlog-title"><div><h2>Backlog</h2><p>Unscheduled issues, including work returned from ended sprints.</p></div><div className="flex-row"><Link className="btn btn-secondary btn-sm" to={`/projects/${project.id}/sprints`}>+ Create sprint</Link><Button size="sm" onClick={() => setCreate(true)}>+ Create issue</Button></div></div>
    <div className="sprint-drop-targets"><strong>Future sprints</strong><span>Drag a backlog issue onto its sprint target.</span>{futureSprints.length ? futureSprints.map((sprint) => <div className="backlog-sprint-target" key={sprint.id}><Link to={`/projects/${project.id}/sprints/${sprint.id}`}>{sprint.name}</Link><button type="button" onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }} onDrop={(e) => moveIssueToSprint(sprint.id, e)}>Drop issue here</button></div>) : <Link className="btn btn-secondary btn-sm" to={`/projects/${project.id}/sprints`}>Create a future sprint</Link>}</div>
    {!issues?.length ? <EmptyState title="Backlog is clear" message="Issues returned from ended sprints and newly created unscheduled work will appear here." action={<Button size="sm" onClick={() => setCreate(true)}>+ Create issue</Button>} /> : <section className="card sprint-backlog-section"><div className="sprint-issue-rows">{issues.map((issue) => <Link className="sprint-issue-row" to={`/issues/${issue.id}`} key={issue.id} draggable onDragStart={(e) => { e.dataTransfer.setData('text/plain', issue.id); e.dataTransfer.effectAllowed = 'move'; }}><span className="sprint-issue-type">{issue.issueType === 'BUG' ? '◆' : '▣'}</span><span className="sprint-issue-key">{issue.key}</span><span className="sprint-issue-title">{issue.title}</span><span className="sprint-issue-assignee">{issue.assignee?.name || 'Unassigned'}</span><Badge variant={issue.status === 'DONE' ? 'green' : issue.status === 'IN_PROGRESS' ? 'blue' : 'grey'}>{issue.status.replaceAll('_', ' ')}</Badge></Link>)}</div></section>}
    {create && <CreateIssueModal projectId={project.id} projectKey={project.key} members={members || []} allowBacklog onClose={() => setCreate(false)} onCreated={() => { reload(); setCreate(false); }} />}
  </div>;
}
