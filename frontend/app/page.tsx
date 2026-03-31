'use client';

import { useState, useRef } from 'react';
import { api } from '../lib/api';

const CATEGORIES = ['Bug', 'Feature Request', 'Improvement', 'Other'] as const;
const MIN_DESC = 20;
const MAX_DESC = 2000;

interface FormData {
  title: string;
  description: string;
  category: string;
  submitterName: string;
  submitterEmail: string;
}

interface FormErrors {
  title?: string;
  description?: string;
  category?: string;
  submitterEmail?: string;
}

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

export default function SubmitPage() {
  const [form, setForm] = useState<FormData>({
    title: '',
    description: '',
    category: '',
    submitterName: '',
    submitterEmail: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const formRef = useRef<HTMLDivElement>(null);

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.title.trim()) e.title = 'Title is required';
    else if (form.title.trim().length > 120) e.title = 'Title must be 120 characters or less';
    if (!form.description.trim()) e.description = 'Description is required';
    else if (form.description.trim().length < MIN_DESC)
      e.description = `Description must be at least ${MIN_DESC} characters`;
    if (!form.category) e.category = 'Please select a category';
    if (form.submitterEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.submitterEmail))
      e.submitterEmail = 'Enter a valid email address';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitState('loading');
    try {
      const res = await api.submitFeedback({
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        submitterName: form.submitterName.trim() || undefined,
        submitterEmail: form.submitterEmail.trim() || undefined,
      });
      if (res.success) {
        setSubmitState('success');
        setForm({ title: '', description: '', category: '', submitterName: '', submitterEmail: '' });
      } else {
        setErrorMessage(res.error || 'Submission failed. Please try again.');
        setSubmitState('error');
      }
    } catch {
      setErrorMessage('Network error. Please check your connection and try again.');
      setSubmitState('error');
    }
  };

  const descLen = form.description.length;
  const descPct = Math.min((descLen / MAX_DESC) * 100, 100);
  const descColor = descLen < MIN_DESC ? '#dc2626' : descLen > MAX_DESC * 0.9 ? '#d97706' : '#16a34a';

  if (submitState === 'success') {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="card" style={{ maxWidth: 480, width: '100%', padding: '3rem 2.5rem', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: 28 }}>
            ✓
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '0.75rem', color: 'var(--success)' }}>
            Feedback received!
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>
            Our AI is analysing your submission right now. Thank you for helping us build better products.
          </p>
          <button className="btn-primary" style={{ width: '100%' }} onClick={() => setSubmitState('idle')}>
            Submit another
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Nav */}
      <nav style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)', padding: '0 2rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontSize: 14, fontWeight: 700 }}>F</span>
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem' }}>FeedPulse</span>
          </div>
          <a href="/login" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textDecoration: 'none', fontWeight: 500 }}>
            Admin →
          </a>
        </div>
      </nav>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '4rem 1.5rem' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div className="badge badge-new" style={{ marginBottom: '1rem', fontSize: '0.75rem' }}>
            ✦ AI-powered analysis
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 2.75rem)', fontWeight: 800, marginBottom: '1rem', lineHeight: 1.15 }}>
            Share your feedback
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.0625rem', maxWidth: 480, margin: '0 auto' }}>
            Bug reports, feature ideas, or improvements — our AI reads every submission and helps the team prioritise instantly.
          </p>
        </div>

        {/* Form */}
        <div ref={formRef} className="card" style={{ padding: '2rem 2.5rem' }}>
          {submitState === 'error' && (
            <div style={{ background: 'var(--error-bg)', border: '1px solid #fca5a5', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.5rem', color: 'var(--error)', fontSize: '0.875rem' }}>
              ⚠ {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Title */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="label">Title <span style={{ color: 'var(--error)' }}>*</span></label>
              <input
                className={`input-field${errors.title ? ' error' : ''}`}
                type="text"
                placeholder="Brief summary of your feedback"
                value={form.title}
                maxLength={120}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
              {errors.title && <p style={{ color: 'var(--error)', fontSize: '0.8125rem', marginTop: '0.375rem' }}>{errors.title}</p>}
            </div>

            {/* Category */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="label">Category <span style={{ color: 'var(--error)' }}>*</span></label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.625rem' }}>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, category: cat }))}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: 12,
                      border: `1.5px solid ${form.category === cat ? 'var(--brand)' : 'var(--border)'}`,
                      background: form.category === cat ? 'var(--brand-light)' : 'var(--bg)',
                      color: form.category === cat ? 'var(--brand)' : 'var(--text-secondary)',
                      fontFamily: 'var(--font-display)',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {cat === 'Bug' ? '🐛' : cat === 'Feature Request' ? '✨' : cat === 'Improvement' ? '⚡' : '💬'} {cat}
                  </button>
                ))}
              </div>
              {errors.category && <p style={{ color: 'var(--error)', fontSize: '0.8125rem', marginTop: '0.375rem' }}>{errors.category}</p>}
            </div>

            {/* Description */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="label">Description <span style={{ color: 'var(--error)' }}>*</span></label>
              <textarea
                className={`input-field${errors.description ? ' error' : ''}`}
                placeholder="Describe the bug, feature, or improvement in detail."
                value={form.description}
                rows={5}
                maxLength={MAX_DESC}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                style={{ resize: 'vertical', minHeight: 120 }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                <div style={{ height: 3, flex: 1, background: 'var(--border)', borderRadius: 2, marginRight: '0.75rem', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${descPct}%`, background: descColor, borderRadius: 2, transition: 'width 0.2s, background 0.2s' }} />
                </div>
                <span style={{ fontSize: '0.75rem', color: descColor, minWidth: 60, textAlign: 'right' }}>
                  {descLen}/{MAX_DESC}
                </span>
              </div>
              {errors.description && <p style={{ color: 'var(--error)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>{errors.description}</p>}
            </div>

            {/* Optional fields */}
            <div style={{ borderTop: '1px solid var(--border)', marginTop: '1.5rem', paddingTop: '1.5rem', marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1rem', fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Optional details
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                <div>
                  <label className="label" style={{ fontSize: '0.8125rem' }}>Your name</label>
                  <input className="input-field" type="text" placeholder="Jane Smith" value={form.submitterName}
                    onChange={e => setForm(f => ({ ...f, submitterName: e.target.value }))} />
                </div>
                <div>
                  <label className="label" style={{ fontSize: '0.8125rem' }}>Your email</label>
                  <input className={`input-field${errors.submitterEmail ? ' error' : ''}`} type="email"
                    placeholder="jane@example.com" value={form.submitterEmail}
                    onChange={e => setForm(f => ({ ...f, submitterEmail: e.target.value }))} />
                  {errors.submitterEmail && <p style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.submitterEmail}</p>}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', fontSize: '1rem', padding: '0.875rem 2rem' }}
              disabled={submitState === 'loading'}
            >
              {submitState === 'loading' ? (
                <>
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                  Submitting…
                </>
              ) : (
                <>Submit feedback →</>
              )}
            </button>
          </form>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}