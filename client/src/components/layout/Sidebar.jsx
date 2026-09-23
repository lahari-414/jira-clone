import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '⌂' },
  { to: '/projects', label: 'Projects', icon: '▤' },
  { to: '/search', label: 'Issues', icon: '◫' },
  { to: '/my-issues', label: 'My issues', icon: '✓' },
];

export default function Sidebar({ mobileOpen = false, onNavigate = () => {} }) {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-brand">
        <span className="mark">A</span>
        {!collapsed && <span>Amivel Tech</span>}
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <span>{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
        {['ADMIN', 'HR'].includes(user?.role) && (
          <>
            {!collapsed && <div className="sidebar-section-label">Administration</div>}
            <NavLink to="/admin" onClick={onNavigate} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <span>⚙</span>
              {!collapsed && <span>Admin panel</span>}
            </NavLink>
          </>
        )}
      </nav>
      <div className="sidebar-toggle">
        <button onClick={() => setCollapsed((c) => !c)}>{collapsed ? '»' : '« Collapse'}</button>
      </div>
    </aside>
  );
}
