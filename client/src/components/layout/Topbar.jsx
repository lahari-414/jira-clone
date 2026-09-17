import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Avatar from '../common/Avatar';

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="topbar">
      <Link to="/search" className="flex-row text-muted" style={{ fontSize: 13 }}>
        ⌕ Search issues…
      </Link>
      <div className="topbar-actions">
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
