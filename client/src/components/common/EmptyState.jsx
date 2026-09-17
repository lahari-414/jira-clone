export default function EmptyState({ title = 'Nothing here yet', message, action }) {
  return (
    <div className="state-block">
      <h3>{title}</h3>
      {message && <p style={{ margin: 0, maxWidth: 340 }}>{message}</p>}
      {action}
    </div>
  );
}
