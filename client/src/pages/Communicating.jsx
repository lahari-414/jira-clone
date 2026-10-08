import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { ideaApi } from '../api/ideaApi';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import Input from '../components/common/Input';
import Textarea from '../components/common/Textarea';
import Avatar from '../components/common/Avatar';
import Spinner from '../components/common/Spinner';

export default function Communicating() {
  const { data: ideas, loading, reload } = useApi(ideaApi.list, []);
  const [searchParams] = useSearchParams();
  const [view, setView] = useState(searchParams.get('new') === '1' ? 'form' : 'list');
  const [form, setForm] = useState({ title: '', content: '' });
  const toast = useToast();
  const { user } = useAuth();
  const submitIdea = async (event) => {
    event.preventDefault();
    try { await ideaApi.create(form); setForm({ title: '', content: '' }); setView('list'); reload(); toast.success('Idea shared with your team'); }
    catch (error) { toast.error(error.response?.data?.message || 'Could not share idea'); }
  };
  return <div className="communicating-page">
    <div className="page-header"><div><h1>Ideas</h1><div className="page-subtitle">{user?.role === 'ADMIN' ? 'Ideas shared by the team.' : 'Ideas you have shared.'}</div></div></div>
    {view === 'form' ? <form className="card card-pad idea-form" onSubmit={submitIdea}><h2>Share a new idea</h2><div className="field"><label>Idea title</label><Input required maxLength={160} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="A clear, memorable headline" /></div><div className="field"><label>Your idea</label><Textarea required maxLength={5000} rows={7} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="What would you like the team to consider?" /></div><button className="btn btn-primary" type="submit">Submit idea</button></form> : <div className="idea-feed"><h2>Previous ideas</h2>{loading ? <Spinner full /> : !ideas?.length ? <div className="card card-pad text-muted">No ideas yet.</div> : ideas.map((idea) => <article className="card idea-card" key={idea.id}><div className="idea-author"><Avatar name={idea.author.name} /><div><strong>{idea.author.name}</strong><small>{new Date(idea.createdAt).toLocaleString()}</small></div></div><h3>{idea.title}</h3><p className="idea-content">{idea.content}</p></article>)}</div>}
  </div>;
}
