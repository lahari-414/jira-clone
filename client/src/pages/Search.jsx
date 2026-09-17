import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { searchApi } from '../api/searchApi';
import { projectApi } from '../api/projectApi';
import { useApi } from '../hooks/useApi';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import Spinner from '../components/common/Spinner';
import { STATUS_LABELS, TYPE_BADGE } from '../utils/format';

export default function Search() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [projectId, setProjectId] = useState('');
  const { data: projects } = useApi(projectApi.list, []);

  const runSearch = async (e) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const issues = await searchApi.issues({ q: q || undefined, status: status || undefined, projectId: projectId || undefined });
      setResults(issues);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { runSearch(); }, []);

  return (
    <div>
      <div className="page-header"><div><h1>Issues</h1><div className="page-subtitle">View issues across every project you are involved in.</div></div></div>
      <form onSubmit={runSearch} className="flex-row" style={{ marginBottom: 18 }}>
        <Input placeholder="Search by issue title or description…" value={q} onChange={(e) => setQ(e.target.value)} style={{ flex: 1 }} />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: 180 }}>
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
        <Select value={projectId} onChange={(e) => setProjectId(e.target.value)} style={{ width: 210 }}>
          <option value="">All projects</option>
          {projects?.map((project) => <option key={project.id} value={project.id}>{project.key} — {project.name}</option>)}
        </Select>
        <button className="btn btn-primary" type="submit">Search</button>
      </form>

      {loading && <Spinner full />}
      {!loading && results?.length === 0 && <EmptyState title="No matching issues" />}

      {!loading && results?.length > 0 && (
        <div className="card">
          <table className="data-table">
            <thead><tr><th>Key</th><th>Title</th><th>Project</th><th>Type</th><th>Status</th><th>Assignee</th></tr></thead>
            <tbody>
              {results.map((issue) => (
                <tr key={issue.id}>
                  <td className="text-muted">{issue.key}</td>
                  <td><Link to={`/issues/${issue.id}`}>{issue.title}</Link></td>
                  <td>{issue.project.name}</td>
                  <td><Badge variant={TYPE_BADGE[issue.issueType]}>{issue.issueType}</Badge></td>
                  <td>{STATUS_LABELS[issue.status]}</td>
                  <td>{issue.assignee?.name || 'Unassigned'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
