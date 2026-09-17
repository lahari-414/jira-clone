import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { issueApi } from '../api/issueApi';
import Spinner from '../components/common/Spinner';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import IssueCard from '../components/board/IssueCard';
import { STATUS_LABELS } from '../utils/format';
import { useToast } from '../contexts/ToastContext';

const COLUMNS = ['TODO', 'IN_PROGRESS', 'DONE'];

export default function ProjectBoard() {
  const { project } = useOutletContext();
  const { data: issues, loading, error, reload, setData } = useApi(() => issueApi.board(project.id), [project.id]);
  const [draggingId, setDraggingId] = useState(null);
  const toast = useToast();

  if (loading) return <Spinner full />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!issues) return null;

  if (issues.length === 0) {
    return (
      <EmptyState
        title="No work on the board yet"
        message="Create an issue, then move it from Backlog to To Do when the team is ready to start."
      />
    );
  }

  const grouped = COLUMNS.reduce((acc, s) => ({ ...acc, [s]: issues.filter((i) => i.status === s) }), {});

  const handleDrop = async (status) => {
    if (!draggingId) return;
    const issue = issues.find((i) => i.id === draggingId);
    if (!issue || issue.status === status) {
      setDraggingId(null);
      return;
    }
    const previousStatus = issue.status;

    // 1. Optimistic UI update
    setData((prev) => prev.map((i) => (i.id === draggingId ? { ...i, status } : i)));
    setDraggingId(null);

    try {
      // 2/3/4. Persist to backend -> DB, creates activity + notifications server-side
      await issueApi.changeStatus(draggingId, status);
    } catch (err) {
      // 6. Revert UI if the API call fails
      setData((prev) => prev.map((i) => (i.id === draggingId ? { ...i, status: previousStatus } : i)));
      toast.error('Could not update issue status. Reverted.');
    }
  };

  return (
    <div className="board-wrap">
      {COLUMNS.map((status) => (
        <div
          key={status}
          className="board-column"
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop(status)}
        >
          <div className="board-column-header">
            <span className="board-column-title">{STATUS_LABELS[status]}</span>
            <span className="board-column-count">{grouped[status].length}</span>
          </div>
          <div className="board-column-body">
            {grouped[status].map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                draggable
                dragging={draggingId === issue.id}
                onDragStart={() => setDraggingId(issue.id)}
                onDragEnd={() => setDraggingId(null)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
