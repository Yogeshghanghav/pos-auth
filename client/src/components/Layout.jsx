import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    toast.success('You have been logged out');
    navigate('/login', { replace: true });
  };

  return (
    <>
      <header className="nav">
        <strong className="brand">Commercial POS</strong>
        <nav>
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/pos">POS</NavLink>
          {user.role === 'admin' && <NavLink to="/users">Users</NavLink>}
        </nav>
        <div className="nav-user">
          <span>{user.name} <span className={`badge ${user.role}`}>{user.role}</span></span>
          <button className="btn ghost" onClick={onLogout}>Log out</button>
        </div>
      </header>
      <main className="page"><Outlet /></main>
    </>
  );
}
