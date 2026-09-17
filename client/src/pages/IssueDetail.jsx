import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { issueApi } from '../api/issueApi';
import { projectApi } from '../api/projectApi';
import Spinner from '../components/common/Spinner';
import ErrorState from '../components/common/ErrorState';
import Badge from '../components/common/Badge';
import Avatar from '../components/common/Avatar';
import Select from '../components/common/Select';
import Textarea from '../components/common/Textarea';
import Button from '../components/common/Button';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { STATUS_LABELS, TYPE_BADGE, timeAgo, formatDate } from '../utils/format';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

export default function IssueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const { data: issue, loading, error, reload, setData } = useApi(() => issueApi.get(id), [id]);
  const { data: comments, reload: reloadComments } = useApi(() => issueApi.comments(id), [id]);
  const { data: activity } = useApi(() => issueApi.activity(id), [id]);
  const { data: attachments, reload: reloadAttachments } = useApi(() => issueApi.attachments(id), [id]);
  const { data: members } = useApi(() => (issue ? projectApi.members(issue.projectId) : Promise.resolve([])), [issue?.projectId]);

  const [commentText, setCommentText] = useState('');
  const [posting, setPosting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [commentDraft, setCommentDraft] = useState('');

  if (loading) return <Spinner full />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!issue) return null;

  const updateField = async (field, value, apiFn) => {
    const prev = issue[field];
    setData((i) => ({ ...i, [field]: value }));
    try {
      await apiFn();
    } catch (err) {
      setData((i) => ({ ...i, [field]: prev }));
      toast.error('Could not update issue');
    }
  };

  const postComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setPosting(true);
    try {
      await issueApi.addComment(id, commentText);
      setCommentText('');
      reloadComments();
    } catch (err) {
      toast.error('Could not post comment');
    } finally {
      setPosting(false);
    }
  };

  const deleteIssue = async () => {
    try {
      await issueApi.remove(id);
      toast.success('Issue deleted');
      navigate(`/projects/${issue.projectId}`);
    } catch (err) {
      toast.error('Could not delete issue');
    }
  };

  const uploadAttachment = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await issueApi.uploadAttachment(id, file);
      reloadAttachments();
      toast.success('Attachment uploaded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not upload attachment');
    } finally {
      event.target.value = '';
      setUploading(false);
    }
  };

  const saveIssue = async () => {
    try {
      const updated = await issueApi.update(id, draft);
      setData(updated); setEditing(false);
      toast.success('Issue updated');
    } catch (err) { toast.error(err.response?.data?.message || 'Could not update issue'); }
  };

  const saveComment = async (commentId) => {
    try {
      await issueApi.updateComment(commentId, commentDraft);
      setEditingCommentId(null); reloadComments(); toast.success('Comment updated');
    } catch (err) { toast.error('Could not update comment'); }
  };

  return (
    <div className="grid-2" style={{ gridTemplateColumns: '2fr 1fr', alignItems: 'start' }}>
      <div>
        <div className="text-muted" style={{ fontSize: 12.5, marginBottom: 4 }}>
          <Link to={`/projects/${issue.projectId}`}>{issue.project.name}</Link> / {issue.key}
        </div>
        <div className="flex-row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
          <h1 style={{ fontSize: 20, margin: 0 }}>{issue.title}</h1>
          {!editing && <Button size="sm" variant="secondary" onClick={() => { setDraft({ title: issue.title, description: issue.description || '', issueType: issue.issueType, priority: issue.priority, dueDate: issue.dueDate?.slice(0, 10) || '' }); setEditing(true); }}>Edit issue</Button>}
        </div>

        <div className="card card-pad" style={{ marginBottom: 16 }}>
          {editing ? <>
            <div className="field"><label>Issue title</label><input className="input" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></div>
            <div className="field"><label>Description</label><Textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></div>
            <div className="grid-2"><div className="field"><label>Priority</label><Select value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value })}>{['LOW', 'MEDIUM', 'HIGH', 'HIGHEST'].map((value) => <option key={value}>{value}</option>)}</Select></div><div className="field"><label>Due date</label><input className="input" type="date" value={draft.dueDate} onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })} /></div></div>
            <div className="flex-row" style={{ justifyContent: 'flex-end' }}><Button size="sm" variant="secondary" onClick={() => setEditing(false)}>Cancel</Button><Button size="sm" onClick={saveIssue}>Save changes</Button></div>
          </> : <><h3 style={{ fontSize: 13, marginBottom: 8 }}>Description</h3><p style={{ margin: 0, fontSize: 13.5, whiteSpace: 'pre-wrap', color: 'var(--ink-700)' }}>{issue.description || 'No description provided.'}</p></>}
        </div>

        <div className="card card-pad" style={{ marginBottom: 16 }}>
          <div className="flex-row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: 13, margin: 0 }}>Attachments ({attachments?.length || 0})</h3>
            <label className="btn btn-secondary btn-sm" style={{ cursor: uploading ? 'wait' : 'pointer' }}>
              {uploading ? 'Uploading…' : '+ Upload file'}
              <input type="file" hidden disabled={uploading} onChange={uploadAttachment} />
            </label>
          </div>
          {!attachments?.length && <p className="text-muted" style={{ margin: 0, fontSize: 13 }}>Upload screenshots, test evidence, or supporting documents (up to 10 MB).</p>}
          {attachments?.map((attachment) => (
            <div key={attachment.id} className="flex-row" style={{ padding: '8px 0', borderTop: '1px solid var(--border)' }}>
              <span style={{ fontSize: 16 }}>📎</span>
              <a href={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${attachment.fileUrl}`} target="_blank" rel="noreferrer" style={{ fontSize: 13, flex: 1 }}>{attachment.fileName}</a>
              <span className="text-muted" style={{ fontSize: 11.5 }}>{Math.ceil(attachment.fileSize / 1024)} KB · {attachment.uploadedBy.name}</span>
              {(attachment.uploadedById === user.id || user.role === 'ADMIN') && <Button size="sm" variant="ghost" onClick={async () => { try { await issueApi.removeAttachment(id, attachment.id); reloadAttachments(); } catch { toast.error('Could not delete attachment'); } }}>Delete</Button>}
            </div>
          ))}
        </div>

        <div className="card card-pad" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 13, marginBottom: 12 }}>Comments ({comments?.length || 0})</h3>
          {comments?.map((c) => (
            <div key={c.id} className="flex-row" style={{ alignItems: 'flex-start', marginBottom: 12 }}>
              <Avatar name={c.author.name} />
              <div style={{ flex: 1 }}>
                <div className="flex-row"><strong style={{ fontSize: 13 }}>{c.author.name}</strong><span className="text-muted" style={{ fontSize: 11.5 }}>{timeAgo(c.createdAt)}</span></div>
                {editingCommentId === c.id ? (
                  <><Textarea value={commentDraft} onChange={(e) => setCommentDraft(e.target.value)} /><div className="flex-row" style={{ marginTop: 5 }}><Button size="sm" onClick={() => saveComment(c.id)}>Save</Button><Button size="sm" variant="ghost" onClick={() => setEditingCommentId(null)}>Cancel</Button></div></>
                ) : (
                  <><p style={{ margin: '2px 0 0', fontSize: 13 }}>{c.content}</p>{(c.authorId === user.id || user.role === 'ADMIN') && <div className="flex-row" style={{ marginTop: 4 }}><button className="btn btn-ghost btn-sm" onClick={() => { setEditingCommentId(c.id); setCommentDraft(c.content); }}>Edit</button><button className="btn btn-ghost btn-sm" onClick={async () => { try { await issueApi.removeComment(c.id); reloadComments(); } catch { toast.error('Could not delete comment'); } }}>Delete</button></div>}</>
                )}
              </div>
            </div>
          ))}
          <form onSubmit={postComment} className="flex-row" style={{ alignItems: 'flex-start', marginTop: 10 }}>
            <Textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Add a comment…" style={{ flex: 1 }} />
          </form>
          <div style={{ textAlign: 'right', marginTop: 8 }}>
            <Button size="sm" onClick={postComment} disabled={posting || !commentText.trim()}>{posting ? 'Posting…' : 'Comment'}</Button>
          </div>
        </div>

        <div className="card card-pad">
          <h3 style={{ fontSize: 13, marginBottom: 12 }}>Activity</h3>
          {(!activity || activity.length === 0) && <p className="text-muted" style={{ margin: 0, fontSize: 13 }}>No activity yet.</p>}
          {activity?.map((a) => (
            <div key={a.id} className="flex-row" style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
              <Avatar name={a.user.name} />
              <span style={{ fontSize: 12.5 }}>
                <strong>{a.user.name}</strong> {a.action.replaceAll('_', ' ').toLowerCase()}
                {a.oldValue && a.newValue ? ` from ${a.oldValue} to ${a.newValue}` : ''}
              </span>
              <span className="text-muted" style={{ fontSize: 11, marginLeft: 'auto' }}>{timeAgo(a.createdAt)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card card-pad">
        <div className="field">
          <label>Status</label>
          <Select value={issue.status} onChange={(e) => updateField('status', e.target.value, () => issueApi.changeStatus(id, e.target.value))}>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </div>
        <div className="field">
          <label>Priority</label>
          <Select value={issue.priority} onChange={(e) => updateField('priority', e.target.value, () => issueApi.changePriority(id, e.target.value))}>
            {['LOW', 'MEDIUM', 'HIGH', 'HIGHEST'].map((p) => <option key={p} value={p}>{p}</option>)}
          </Select>
        </div>
        <div className="field">
          <label>Assignee</label>
          <Select value={issue.assigneeId || ''} onChange={(e) => updateField('assigneeId', e.target.value, () => issueApi.changeAssignee(id, e.target.value || null))}>
            <option value="">Unassigned</option>
            {members?.map((m) => <option key={m.user.id} value={m.user.id}>{m.user.name}</option>)}
          </Select>
        </div>
        <div className="field">
          <label>Type</label>
          <Badge variant={TYPE_BADGE[issue.issueType]}>{issue.issueType}</Badge>
        </div>
        <div className="field">
          <label>Reporter</label>
          <div className="flex-row"><Avatar name={issue.reporter.name} /><span style={{ fontSize: 13 }}>{issue.reporter.name}</span></div>
        </div>
        <div className="field">
          <label>Due date</label>
          <div style={{ fontSize: 13 }}>{formatDate(issue.dueDate)}</div>
        </div>
        <div className="divider" />
        <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)} style={{ width: '100%' }}>Delete issue</Button>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Delete this issue?"
          message="This will permanently remove the issue, its comments, and its activity history."
          confirmLabel="Delete"
          danger
          onConfirm={deleteIssue}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}
