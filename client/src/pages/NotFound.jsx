import { Link } from 'react-router-dom';
import Button from '../components/common/Button';

export default function NotFound() {
  return (
    <div className="state-block" style={{ minHeight: '60vh' }}>
      <h3 style={{ fontSize: 24 }}>404</h3>
      <p>This page doesn't exist.</p>
      <Link to="/dashboard"><Button size="sm">Back to dashboard</Button></Link>
    </div>
  );
}
