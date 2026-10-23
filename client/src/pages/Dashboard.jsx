import { useAuth } from '../AuthContext';

// Placeholder: replace with your existing dashboard page.
export default function Dashboard() {
  const { user } = useAuth();
  return (
    <div className="card">
      <h1>Dashboard</h1>
      <p>Signed in as <strong>{user.email}</strong> ({user.role}).</p>
      <p className="muted">Replace this page with your existing dashboard component.</p>
    </div>
  );
}
