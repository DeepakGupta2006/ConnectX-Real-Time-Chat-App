// Owner: Member 1 (Frontend Developer)  -  feature/login-register
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';

export default function Register() {
  const { register } = useAuth();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register(form.username, form.email, form.password);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Chat privately or in groups, in real time"
      footer={<>Already registered? <Link to="/login">Log in</Link></>}
    >
      <form onSubmit={submit} className="form">
        <label>
          Username
          <input value={form.username} onChange={set('username')} minLength={3} maxLength={30} autoComplete="username" required autoFocus />
        </label>
        <label>
          Email
          <input type="email" value={form.email} onChange={set('email')} autoComplete="email" required />
        </label>
        <label>
          Password <span className="muted small">(min. 8 characters)</span>
          <input type="password" value={form.password} onChange={set('password')} minLength={8} autoComplete="new-password" required />
        </label>
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="btn primary" disabled={busy}>{busy ? 'Creating…' : 'Sign up'}</button>
      </form>
    </AuthLayout>
  );
}
