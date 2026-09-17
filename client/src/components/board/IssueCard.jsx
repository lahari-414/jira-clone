import Badge from '../common/Badge';
import Avatar from '../common/Avatar';
import { PRIORITY_COLORS, TYPE_BADGE } from '../../utils/format';
import { Link } from 'react-router-dom';

export default function IssueCard({ issue, draggable, onDragStart, onDragEnd, dragging }) {
  return (
    <Link
      to={`/issues/${issue.id}`}
      className={`issue-card ${dragging ? 'dragging' : ''}`}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      style={{ display: 'block' }}
    >
      <div className="issue-card-key">{issue.key}</div>
      <div className="issue-card-title">{issue.title}</div>
      <div className="issue-card-footer">
        <div className="issue-card-badges">
          <Badge variant={TYPE_BADGE[issue.issueType]}>{issue.issueType}</Badge>
          <span className="priority-dot" style={{ background: PRIORITY_COLORS[issue.priority] }} title={issue.priority} />
        </div>
        {issue.assignee && <Avatar name={issue.assignee.name} />}
      </div>
    </Link>
  );
}
