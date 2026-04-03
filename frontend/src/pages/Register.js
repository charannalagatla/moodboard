import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm]       = useState({ name: '', email: '', password: '' });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const { loginUser }         = useAuth();
  const navigate              = useNavigate();

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      const { data } = await register(form);
      loginUser(data.token, data.user);
      navigate('/');
    } catch (err) {
      const res = err.response?.data;
      if (res?.errors) {
        const map = {};
        res.errors.forEach(({ path, msg }) => { map[path] = msg; });
        setErrors(map);
      } else {
        setErrors({ global: res?.error || 'Registration failed.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card fade-up">
        <div className="auth-logo">
          <h1>Mood<span>Board</span></h1>
          <p>Your private emotion journal.</p>
        </div>

        <div className="card">
          <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 20, marginBottom: 24 }}>
            Create account
          </h2>

          {errors.global && (
            <div style={{
              background: 'rgba(240,119,119,0.1)',
              border: '1px solid rgba(240,119,119,0.25)',
              borderRadius: 8,
              padding: '10px 14px',
              marginBottom: 20,
              fontSize: 13,
              color: '#f09090',
            }}>
              {errors.global}
            </div>
          )}

          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label htmlFor="name">Your name</label>
              <input
                id="name"
                type="text"
                name="name"
                value={form.name}
                onChange={onChange}
                placeholder="Alex"
                required
                autoFocus
              />
              {errors.name && <p className="error-text">{errors.name}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={onChange}
                placeholder="you@example.com"
                required
              />
              {errors.email && <p className="error-text">{errors.email}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password <span style={{ textTransform: 'none', opacity: 0.5 }}>(min. 6 chars)</span></label>
              <input
                id="password"
                type="password"
                name="password"
                value={form.password}
                onChange={onChange}
                placeholder="••••••••"
                required
                minLength={6}
              />
              {errors.password && <p className="error-text">{errors.password}</p>}
            </div>

            <button
              type="submit"
              className="btn btn-teal btn-full"
              disabled={loading}
              style={{ marginTop: 8 }}
            >
              {loading ? <><span className="spinner" />Creating account…</> : 'Get started'}
            </button>
          </form>

          <div className="auth-divider" style={{ marginTop: 24 }}>or</div>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--indigo-light)' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
