import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import UserManagement from './pages/UserManagement';
import Unauthorized from './pages/Unauthorized';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/pos" element={<POS />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="/users" element={<UserManagement />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
