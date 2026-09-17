export function initials(name = '') {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function timeAgo(date) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export const STATUS_LABELS = {
  BACKLOG: 'Backlog',
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
};

export const PRIORITY_COLORS = {
  LOW: '#6B7280',
  MEDIUM: '#3E5AF0',
  HIGH: '#D98A2B',
  HIGHEST: '#C63B4B',
};

export const TYPE_BADGE = {
  TASK: 'badge-blue',
  BUG: 'badge-red',
  STORY: 'badge-green',
  EPIC: 'badge-violet',
  IMPROVEMENT: 'badge-amber',
};
