import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api, { parseError } from '../api';
import { useAuth } from '../AuthContext';
import Modal from '../components/Modal';
import Field from '../components/Field';

const LIMIT = 10;
const emailOk = (v) => /^\S+@\S+\.\S+$/.test(v);
const pwOk = (v) => v.length >= 8 && /[A-Z]/.test(v) && /[0-9]/.test(v);
const PW_HINT = 'At least 8 characters, with an uppercase letter and a number';

function UserForm({ user, onSaved, onClose }) {
  const editing = !!user;
  const [form, setForm] = useState({
    name: user?.name || '', email: user?.email || '', role: user?.role || 'staff', password: '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);
  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (form.name.trim().length < 2) next.name = 'Name must be at least 2 characters';
    if (!emailOk(form.email)) next.email = 'Enter a valid email address';
    if ((!editing || form.password) && !pwOk(form.password)) next.password = PW_HINT;
    setErrors(next);
    setServerError('');
    if (Object.keys(next).length) return;

    const payload = { name: form.name.trim(), email: form.email.trim(), role: form.role };
    if (form.password) payload.password = form.password;

    setSaving(true);
    try {
      if (editing) await api.put(`/users/${user._id}`, payload);
      else await api.post('/users', payload);
      toast.success(editing ? 'User updated' : 'User created');
      onSaved();
    } catch (err) {
      const { message, fields } = parseError(err);
      setErrors(fields);
      setServerError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={editing ? 'Edit user' : 'Add user'} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        {serverError && <div className="banner error" role="alert">{serverError}</div>}
        <Field label="Full name" name="name" value={form.name} onChange={onChange} error={errors.name} />
        <Field label="Email" name="email" type="email" value={form.email} onChange={onChange} error={errors.email} />
        <div className="field">
          <label htmlFor="f-role">Role</label>
          <select id="f-role" name="role" value={form.role} onChange={onChange}>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <Field label={editing ? 'New password (leave blank to keep current)' : 'Password'} name="password"
               type="password" autoComplete="new-password" value={form.password}
               onChange={onChange} error={errors.password} />
        {!errors.password && <p className="muted small">{PW_HINT}</p>}
        <div className="actions">
          <button type="button" className="btn ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn primary" disabled={saving}>
            {saving && <span className="spinner" />} {editing ? 'Save changes' : 'Create user'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ConfirmStatus({ user, onDone, onClose }) {
  const [busy, setBusy] = useState(false);
  const activating = !user.isActive;
  const confirm = async () => {
    setBusy(true);
    try {
      await api.patch(`/users/${user._id}/status`, { isActive: activating });
      toast.success(activating ? 'User activated' : 'User deactivated');
      onDone();
    } catch (err) {
      toast.error(parseError(err).message);
      setBusy(false);
    }
  };
  return (
    <Modal title={activating ? 'Activate user' : 'Deactivate user'} onClose={onClose}>
      <p>
        {activating
          ? <>{user.name} will be able to sign in again.</>
          : <>{user.name} will be signed out and blocked from signing in until you activate the account again.</>}
      </p>
      <div className="actions">
        <button className="btn ghost" onClick={onClose} disabled={busy}>Cancel</button>
        <button className={`btn ${activating ? 'primary' : 'danger'}`} onClick={confirm} disabled={busy}>
          {busy && <span className="spinner" />} {activating ? 'Activate' : 'Deactivate'}
        </button>
      </div>
    </Modal>
  );
}

export default function UserManagement() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [dialog, setDialog] = useState(null); // {type:'form'|'status', user?}

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const { data } = await api.get('/users', { params: { search, page, limit: LIMIT } });
      setUsers(data.users);
      setTotal(data.total);
    } catch (err) {
      setLoadError(parseError(err).message);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  const pages = Math.max(Math.ceil(total / LIMIT), 1);
  const closeAnd = (reload) => () => { setDialog(null); if (reload) load(); };

  return (
    <div className="card">
      <div className="toolbar">
        <h1>Users</h1>
        <input className="search" type="search" placeholder="Search by name or email"
               aria-label="Search users" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
        <button className="btn primary" onClick={() => setDialog({ type: 'form' })}>Add user</button>
      </div>

      {loadError && (
        <div className="banner error" role="alert">
          {loadError} <button className="link" onClick={load}>Try again</button>
        </div>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Last login</th><th /></tr>
          </thead>
          <tbody>
            {loading && Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>{Array.from({ length: 6 }).map((__, j) => <td key={j}><span className="skeleton" /></td>)}</tr>
            ))}
            {!loading && users.map((u) => (
              <tr key={u._id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td><span className={`badge ${u.role}`}>{u.role}</span></td>
                <td><span className={`badge ${u.isActive ? 'active' : 'inactive'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                <td>{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}</td>
                <td className="row-actions">
                  <button className="btn small ghost" onClick={() => setDialog({ type: 'form', user: u })}>Edit</button>
                  <button className="btn small ghost" disabled={u._id === me._id}
                          title={u._id === me._id ? 'You cannot deactivate your own account' : undefined}
                          onClick={() => setDialog({ type: 'status', user: u })}>
                    {u.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
            {!loading && !loadError && users.length === 0 && (
              <tr><td colSpan="6" className="empty">
                {search ? `No users match “${search}”.` : 'No users yet. Add the first staff account.'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pager">
        <span className="muted">{total} {total === 1 ? 'user' : 'users'}</span>
        <button className="btn small ghost" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}>Previous</button>
        <span>Page {page} of {pages}</span>
        <button className="btn small ghost" disabled={page >= pages || loading} onClick={() => setPage(page + 1)}>Next</button>
      </div>

      {dialog?.type === 'form' && <UserForm user={dialog.user} onSaved={closeAnd(true)} onClose={closeAnd(false)} />}
      {dialog?.type === 'status' && <ConfirmStatus user={dialog.user} onDone={closeAnd(true)} onClose={closeAnd(false)} />}
    </div>
  );
}
