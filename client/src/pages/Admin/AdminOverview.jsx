import { useApi } from '../../hooks/useApi';
import { adminApi } from '../../api/adminApi';
import Spinner from '../../components/common/Spinner';
import ErrorState from '../../components/common/ErrorState';

export default function AdminOverview() {
  const { data, loading, error, reload } = useApi(adminApi.stats, []);
  if (loading) return <Spinner full />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="stat-grid">
      <div className="card stat-card"><div className="num">{data.users}</div><div className="label">Total users</div></div>
      <div className="card stat-card"><div className="num">{data.projects}</div><div className="label">Total projects</div></div>
      <div className="card stat-card"><div className="num">{data.issues}</div><div className="label">Total issues</div></div>
    </div>
  );
}
