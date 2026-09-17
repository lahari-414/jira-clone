import { initials } from '../../utils/format';

export default function Avatar({ name, size = 'md' }) {
  if (!name) return <div className={`avatar ${size === 'lg' ? 'avatar-lg' : ''}`}>?</div>;
  return <div className={`avatar ${size === 'lg' ? 'avatar-lg' : ''}`} title={name}>{initials(name)}</div>;
}
