'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Both fields are required'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await api.login(email, password);
      if (res.success && res.data?.token) {
        localStorage.setItem('feedpulse_token', res.data.token);
        router.push('/dashboard');
      } else {
        setError(res.error || 'Invalid credentials');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      fontFamily: 'var(--font-body)',
    }}>
      {/* Left panel — branding */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3bab 0%, #3d68f0 50%, #6690f5 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '3rem',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background decoration */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 250, height: 250, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative' }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
            <span style={{ color: 'white', fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-display)' }}>F</span>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.25rem' }}>FeedPulse</span>
        </div>

        {/* Center content */}
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', borderRadius: 999, padding: '0.375rem 1rem', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '1.5rem' }}>
            ✦ AI-Powered Platform
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.15, marginBottom: '1rem' }}>
            Turn feedback into<br />product decisions
          </h1>
          <p style={{ opacity: 0.8, fontSize: '1rem', lineHeight: 1.7, maxWidth: 380 }}>
            Every piece of feedback is automatically analysed by Gemini AI — categorised, prioritised, and summarised so your team knows exactly what to build next.
          </p>

          {/* Feature pills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '2rem' }}>
            {[
              { icon: '⚡', text: 'Instant AI analysis on every submission' },
              { icon: '🎯', text: 'Priority scoring from 1–10 automatically' },
              { icon: '📊', text: 'Weekly trend summaries for your team' },
            ].map(f => (
              <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '0.75rem 1rem', backdropFilter: 'blur(10px)' }}>
                <span style={{ fontSize: '1.125rem' }}>{f.icon}</span>
                <span style={{ fontSize: '0.875rem', opacity: 0.9 }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <p style={{ opacity: 0.5, fontSize: '0.8125rem', position: 'relative' }}>
          © 2024 FeedPulse. Built with Next.js + Gemini AI.
        </p>
      </div>

      {/* Right panel — login form */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem',
        background: 'var(--bg)',
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.875rem', marginBottom: '0.5rem' }}>
              Welcome back
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Sign in to your admin dashboard
            </p>
          </div>

          {error && (
            <div style={{
              background: 'var(--error-bg)',
              border: '1px solid #fca5a5',
              borderRadius: 12,
              padding: '0.875rem 1rem',
              marginBottom: '1.5rem',
              color: 'var(--error)',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="label">Email address</label>
              <input
                className="input-field"
                type="email"
                placeholder="admin@feedpulse.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label className="label">Password</label>
              <input
                className="input-field"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', padding: '0.875rem', fontSize: '1rem' }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                  Signing in…
                </>
              ) : 'Sign in →'}
            </button>
          </form>

          <div style={{
            marginTop: '2rem',
            padding: '1rem 1.25rem',
            background: 'var(--brand-light)',
            borderRadius: 12,
            border: '1px solid #b9cbff',
          }}>
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--brand)', marginBottom: '0.375rem', fontFamily: 'var(--font-display)' }}>
              Demo credentials
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--brand)' }}>
              admin@feedpulse.com / admin123
            </p>
          </div>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Not an admin?{' '}
            <a href="/" style={{ color: 'var(--brand)', textDecoration: 'none', fontWeight: 600 }}>
              Submit feedback instead →
            </a>
          </p>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}