import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../AuthContext';
import { parseError } from '../api';
import Field from '../components/Field';

const emailOk = (v) => /^\S+@\S+\.\S+$/.test(v);

export default function Login() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to="/dashboard" replace />;

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!emailOk(form.email)) next.email = 'Enter a valid email address';
    if (!form.password) next.password = 'Password is required';
    setErrors(next);
    setServerError('');
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      await login(form.email.trim(), form.password);
      toast.success('Welcome back');
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    } catch (err) {
      const { message, fields } = parseError(err);
      setErrors(fields);
      setServerError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="center-screen">
      <form className="card login" onSubmit={onSubmit} noValidate>
        <h1>Sign in</h1>
        <p className="muted">Use the account your admin created for you.</p>
        {serverError && <div className="banner error" role="alert">{serverError}</div>}
        <Field label="Email" name="email" type="email" autoComplete="username"
               value={form.email} onChange={onChange} error={errors.email} />
        <Field label="Password" name="password" type="password" autoComplete="current-password"
               value={form.password} onChange={onChange} error={errors.password} />
        <button className="btn primary block" disabled={submitting}>
          {submitting && <span className="spinner" />} {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
