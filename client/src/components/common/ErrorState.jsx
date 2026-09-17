export default function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="state-block">
      <h3>Couldn't load this</h3>
      <p style={{ margin: 0 }}>{message}</p>
      {onRetry && (
        <button className="btn btn-secondary btn-sm" onClick={onRetry} style={{ marginTop: 6 }}>
          Try again
        </button>
      )}
    </div>
  );
}
