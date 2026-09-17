export default function Spinner({ full }) {
  if (full) {
    return (
      <div className="state-block">
        <div className="spinner" />
      </div>
    );
  }
  return <div className="spinner" />;
}
