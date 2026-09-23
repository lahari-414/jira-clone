import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Avatar from '../common/Avatar';
import { useApi } from '../../hooks/useApi';
import { notificationApi } from '../../api/notificationApi';

export default function Topbar({ onMenu = () => {} }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { data: notifications } = useApi(notificationApi.list, []);

  return (
    <header className="topbar">
      <button className="mobile-menu-button" onClick={onMenu} aria-label="Toggle navigation">☰</button>
      <Link to="/search" className="flex-row text-muted" style={{ fontSize: 13 }}>
        ⌕ Search issues…
      </Link>
      <div className="topbar-actions">
        <Link to="/notifications" className="notification-link" aria-label={`${notifications?.unreadCount || 0} unread notifications`} title="Notifications">
          <span aria-hidden="true">🔔</span>
          {notifications?.unreadCount > 0 && <span className="notification-count">{notifications.unreadCount > 99 ? '99+' : notifications.unreadCount}</span>}
        </Link>
        <Link to="/profile" className="flex-row">
          <Avatar name={user?.name} />
        </Link>
        <button className="btn btn-ghost btn-sm" onClick={() => { logout(); navigate('/login'); }}>
          Sign out
        </button>
      </div>
    </header>
  );
}
