import { useEffect, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { sprintApi } from '../api/sprintApi';
import { issueApi } from '../api/issueApi';
import { projectApi } from '../api/projectApi';
import IssueCard from '../components/board/IssueCard';
import CreateIssueModal from '../components/issue/CreateIssueModal';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Spinner from '../components/common/Spinner';
import ErrorState from '../components/common/ErrorState';
import { useToast } from '../contexts/ToastContext';
import { STATUS_LABELS } from '../utils/format';
import { useAuth } from '../contexts/AuthContext';

const columns = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
const labels = { ...STATUS_LABELS, TODO: 'TO DO', IN_REVIEW: 'REVIEW' };
export default function SprintBoard() {
  const { project } = useOutletContext();
  const { sprintId } = useParams();
  const { data: sprint, loading, error, reload } = useApi(() => sprintApi.get(sprintId), [sprintId]);
  const { data: issues, loading: issuesLoading, error: issuesError, setData, reload: reloadIssues } = useApi(() => issueApi.sprintBoard(project.id, sprintId), [project.id, sprintId]);
  const { data: members } = useApi(() => projectApi.members(project.id), [project.id]);
  const { data: allSprints } = useApi(() => sprintApi.listByProject(project.id), [project.id]);
  const [dragId, setDragId] = useState(null);
  const [participantId, setParticipantId] = useState('');
  const [quickFilter, setQuickFilter] = useState('');
  const [create, setCreate] = useState(false);
  const toast = useToast();
  const { user } = useAuth();
  useEffect(() => {
    const timer = setInterval(() => { reload(); reloadIssues(); }, 30_000);
    return () => clearInterval(timer);
  }, [reload, reloadIssues]);
  if (loading) return <Spinner full />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (issuesLoading) return <Spinner full />;
  if (issuesError) return <ErrorState message={issuesError} onRetry={reloadIssues} />;
  const onDrop = async (status, event) => {
    event?.preventDefault();
    const issueId = event?.dataTransfer?.getData('text/plain') || dragId;
    if (!issueId) return;
    const issue = issues?.find((item) => item.id === issueId);
    setDragId(null);
    if (!issue || issue.status === status) return;
    setData((list) => list.map((item) => item.id === issueId ? { ...item, status } : item));
    try { await issueApi.changeStatus(issueId, status); }
    catch { setData((list) => list.map((item) => item.id === issueId ? { ...item, status: issue.status } : item)); toast.error('Could not update issue status'); }
  };
  const moveToSprint = async (targetSprintId, event) => {
    event?.preventDefault();
    const issueId = event?.dataTransfer?.getData('text/plain') || dragId;
    if (!issueId || targetSprintId === sprintId) return;
    setDragId(null);
    try { await issueApi.update(issueId, { sprintId: targetSprintId }); await reloadIssues(); toast.success('Issue moved to sprint'); }
    catch (err) { toast.error(err.response?.data?.message || 'Could not move issue'); }
  };
  const completeSprint = async () => {
    try { await sprintApi.complete(sprintId); toast.success('Sprint completed'); reload(); reloadIssues(); }
    catch (err) { toast.error(err.response?.data?.message || 'Could not complete sprint'); }
  };
  const remaining = sprint?.endDate ? new Date(sprint.endDate).getTime() - Date.now() : null;
  const timeLeft = remaining == null ? 'No end date' : remaining <= 0 ? 'Ended' : `${Math.ceil(remaining / 86400000)} days remaining`;
  const assignedCounts = members?.map((member) => ({ ...member, count: issues?.filter((issue) => issue.assigneeId === member.userId).length || 0 })).filter((member) => member.count > 0) || [];
  const visibleIssues = (issues || []).filter((issue) => {
    if (participantId && issue.assigneeId !== participantId) return false;
    if (quickFilter === 'mine' && issue.assigneeId !== user?.id) return false;
    if (quickFilter === 'unassigned' && issue.assigneeId) return false;
    if (quickFilter === 'recent' && Date.now() - new Date(issue.updatedAt).getTime() > 7 * 86400000) return false;
    return true;
  });
  const nextSprints = (allSprints || []).filter((item) => item.id !== sprintId && item.status === 'FUTURE' && (!item.endDate || new Date(item.endDate).getTime() > Date.now()));
  const canAddIssues = !['COMPLETED', 'CANCELLED'].includes(sprint.status) && (!sprint.endDate || new Date(sprint.endDate).getTime() > Date.now());
  return <div>
    <div className="page-header sprint-page-title"><div><Link className="text-muted" to={`/projects/${project.id}/sprints`}>← Sprints</Link><h1>{sprint.name}</h1><div className="page-subtitle">{sprint.goal || 'Plan and track issue progress'}</div></div><div className="flex-row"><span className="sprint-time-left">◷ {timeLeft}</span>{sprint.status === 'ACTIVE' && <Button variant="secondary" onClick={completeSprint}>Complete sprint</Button>}{canAddIssues && <Button onClick={() => setCreate(true)}>+ Add issue</Button>}</div></div>
    {/* <div className="sprint-metrics"><div><span>Total issues</span><strong>{issues?.length || 0}</strong></div><div><span>Completed</span><strong>{issues?.filter((i) => i.status === 'DONE').length || 0}</strong></div><div><span>In progress</span><strong>{issues?.filter((i) => i.status === 'IN_PROGRESS').length || 0}</strong></div><div><span>Remaining</span><strong>{(issues?.length || 0) - (issues?.filter((i) => i.status === 'DONE').length || 0)}</strong></div><div><span>Completion</span><strong>{issues?.length ? Math.round(issues.filter((i) => i.status === 'DONE').length / issues.length * 100) : 0}%</strong></div><div><span>Dates</span><strong>{sprint.startDate ? new Date(sprint.startDate).toLocaleString() : 'Not set'} – {sprint.endDate ? new Date(sprint.endDate).toLocaleString() : 'Not set'}</strong></div></div> */}
    <div className="sprint-quick-filters"><strong>Quick filters</strong><button type="button" className={!participantId && !quickFilter ? 'selected' : ''} onClick={() => { setParticipantId(''); setQuickFilter(''); }}>All issues</button><button type="button" className={quickFilter === 'mine' ? 'selected' : ''} onClick={() => { setParticipantId(''); setQuickFilter(quickFilter === 'mine' ? '' : 'mine'); }}>Only my issues</button><button type="button" className={quickFilter === 'recent' ? 'selected' : ''} onClick={() => { setParticipantId(''); setQuickFilter(quickFilter === 'recent' ? '' : 'recent'); }}>Recently updated</button>
    <button type="button" className={quickFilter === 'unassigned' ? 'selected' : ''} onClick={() => { setParticipantId(''); setQuickFilter(quickFilter === 'unassigned' ? '' : 'unassigned'); }}>Unassigned</button>
    {/* {assignedCounts.map((member) => 
    <button type="button" key={member.id} className={participantId === member.userId ? 'selected' : ''} onClick={() => { setQuickFilter(''); setParticipantId(participantId === member.userId ? '' : member.userId); }}>{member.user.name}</button>)} */}
    </div>
    {/* <div className="page-header sprint-page-title"><b>Participent</b>{assignedCounts.map((member) => 
    <button type="button" key={member.id} className={participantId === member.userId ? 'selected' : ''} onClick={() => { setQuickFilter(''); setParticipantId(participantId === member.userId ? '' : member.userId); }}>{member.user.name}</button>)}</div> */}
    <div className="sprint-drop-targets"><strong>Future sprints</strong><span>Drag any issue into the sprint you choose.</span>{nextSprints.length ? nextSprints.map((item) => <button type="button" key={item.id} onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }} onDrop={(e) => { e.stopPropagation(); moveToSprint(item.id, e); }}>{item.name}</button>) : <Link className="btn btn-secondary btn-sm" to={`/projects/${project.id}/sprints`}>Create a future sprint</Link>}</div>
    <div className="sprint-board-layout"><div className="board-wrap sprint-board">{columns.map((status) => { const grouped = visibleIssues.filter((issue) => status === 'TODO' ? ['TODO', 'BACKLOG'].includes(issue.status) : status === 'IN_PROGRESS' ? ['IN_PROGRESS', 'BLOCKED', 'ON_HOLD'].includes(issue.status) : issue.status === status); return <div key={status} className="board-column" onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDrop(status, e)}><div className="board-column-header"><span className="board-column-title">{labels[status]}</span><span className="board-column-count">{grouped.length}</span></div><div className="board-column-body">{grouped.map((issue) => <IssueCard key={issue.id} issue={issue} draggable dragging={dragId === issue.id} onDragStart={(event) => { event.dataTransfer.setData('text/plain', issue.id); event.dataTransfer.effectAllowed = 'move'; setDragId(issue.id); }} onDragEnd={() => setDragId(null)} />)}</div></div>; })}</div><aside className="sprint-participant-rail"><strong>Participants</strong><button type="button" className={!participantId ? 'selected' : ''} onClick={() => { setParticipantId(''); setQuickFilter(''); }}><span className="participant-avatar">All</span><span>Everyone</span><b>{issues?.length || 0}</b></button>{assignedCounts.map((member) => <button type="button" key={member.id} className={participantId === member.userId ? 'selected' : ''} onClick={() => { setQuickFilter(''); setParticipantId(participantId === member.userId ? '' : member.userId); }}><span className="participant-avatar">{member.user.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</span><span>{member.user.name}</span><b>{member.count}</b></button>)}</aside></div>
    {create && <CreateIssueModal projectId={project.id} projectKey={project.key} members={members || []} initialSprintId={sprintId} onClose={() => setCreate(false)} onCreated={() => { setCreate(false); reloadIssues(); reload(); }} />}
  </div>;
}
