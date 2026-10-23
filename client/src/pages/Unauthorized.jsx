import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <div className="card">
      <h1>No access</h1>
      <p>Your role does not allow you to open this page. Ask an admin if you need access.</p>
      <Link className="btn primary" to="/dashboard">Back to dashboard</Link>
    </div>
  );
}
