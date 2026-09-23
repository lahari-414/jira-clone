import { NavLink, Outlet } from 'react-router-dom';

const tabs = [
  { to: '', label: 'Overview', end: true },
  { to: 'users', label: 'Users' },
  { to: 'audit-logs', label: 'Audit logs' },
];

export default function Admin() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Admin &amp; HR panel</h1>
          <div className="page-subtitle">Workspace administration and people management.</div>
        </div>
      </div>
      <div className="tabs">
        {tabs.map((t) => (
          <NavLink key={t.label} to={t.to} end={t.end} className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}>
            {t.label}
          </NavLink>
        ))}
      </div>
      <Outlet />
    </div>
  );
}
