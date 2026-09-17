export default function Button({ variant = 'primary', size, children, className = '', ...props }) {
  const cls = `btn btn-${variant} ${size === 'sm' ? 'btn-sm' : ''} ${className}`;
  return (
    <button className={cls} {...props}>
      {children}
    </button>
  );
}
