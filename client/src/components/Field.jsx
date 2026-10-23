export default function Field({ label, error, ...props }) {
  const id = `f-${props.name}`;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} {...props} />
      {error && <p className="field-error" id={`${id}-err`}>{error}</p>}
    </div>
  );
}
