'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, FeedbackItem, FeedbackListResponse, StatsResponse } from '../../lib/api';

// ── Helpers ──────────────────────────────────────────────────────────────────

function sentimentBadge(s?: string) {
  if (!s) return <span className="badge badge-neutral">Pending</span>;
  const cls = s === 'Positive' ? 'badge-positive' : s === 'Negative' ? 'badge-negative' : 'badge-neutral';
  const icon = s === 'Positive' ? '↑' : s === 'Negative' ? '↓' : '→';
  return <span className={`badge ${cls}`}>{icon} {s}</span>;
}

function statusBadge(s: string) {
  const cls = s === 'New' ? 'badge-new' : s === 'In Review' ? 'badge-review' : 'badge-resolved';
  return <span className={`badge ${cls}`}>{s}</span>;
}

function priorityBar(p?: number) {
  if (!p) return <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>—</span>;
  const color = p >= 8 ? '#dc2626' : p >= 5 ? '#d97706' : '#16a34a';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ width: 60, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${p * 10}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color, fontVariantNumeric: 'tabular-nums' }}>{p}</span>
    </div>
  );
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();

  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 });
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [summary, setSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [filters, setFilters] = useState({
    category: '',
    status: '',
    sentiment: '',
    sortBy: 'createdAt',
    order: 'desc',
    search: '',
    page: '1',
  });

  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<FeedbackItem | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Auth guard
  useEffect(() => {
    const token = localStorage.getItem('feedpulse_token');
    if (!token) router.replace('/login');
  }, [router]);

  const logout = () => {
    localStorage.removeItem('feedpulse_token');
    router.push('/login');
  };

  // Fetch feedback
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: '10', ...filters };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const res = await api.getAllFeedback(params);
      if (res.success) {
        setItems((res.data as FeedbackListResponse).items);
        setPagination((res.data as FeedbackListResponse).pagination);
      } else if ((res as { status?: number }).status === 401) {
        router.replace('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [filters, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Fetch stats on mount
  useEffect(() => {
    api.getStats().then(r => { if (r.success) setStats(r.data as StatsResponse); });
  }, []);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(f => ({ ...f, [key]: value, page: '1' }));
  };

  const handlePageChange = (p: number) => {
    setFilters(f => ({ ...f, page: String(p) }));
  };

  const handleStatusChange = async (id: string, status: string) => {
    setActionLoading(id + status);
    const res = await api.updateStatus(id, status);
    if (res.success) {
      setItems(prev => prev.map(i => i._id === id ? { ...i, status: res.data.status } : i));
      if (selected?._id === id) setSelected(res.data);
    }
    setActionLoading(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this feedback item?')) return;
    setActionLoading(id + 'del');
    const res = await api.deleteFeedback(id);
    if (res.success) {
      setItems(prev => prev.filter(i => i._id !== id));
      if (selected?._id === id) setSelected(null);
    }
    setActionLoading(null);
  };

  const handleReanalyse = async (id: string) => {
    setActionLoading(id + 'ai');
    const res = await api.reanalyse(id);
    if (res.success) {
      setItems(prev => prev.map(i => i._id === id ? res.data : i));
      if (selected?._id === id) setSelected(res.data);
    }
    setActionLoading(null);
  };

  const loadSummary = async () => {
    setSummaryLoading(true);
    const res = await api.getWeeklySummary();
    if (res.success) setSummary((res.data as { summary: string }).summary);
    setSummaryLoading(false);
  };

  const STATUSES = ['New', 'In Review', 'Resolved'];
  const CATEGORIES = ['Bug', 'Feature Request', 'Improvement', 'Other'];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-body)' }}>
      {/* Navbar */}
      <nav style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontSize: 13, fontWeight: 800, fontFamily: 'var(--font-display)' }}>F</span>
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>FeedPulse</span>
            <span className="badge badge-new" style={{ fontSize: '0.7rem', marginLeft: '0.25rem' }}>Admin</span>
          </div>
          <button onClick={logout} className="btn-secondary" style={{ padding: '0.4rem 0.875rem', fontSize: '0.875rem' }}>
            Sign out
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Stats bar */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Total feedback', value: stats.total, icon: '📋' },
              { label: 'Open items', value: stats.open, icon: '🔓' },
              { label: 'Avg priority', value: stats.averagePriority, icon: '🎯' },
              { label: 'Top tag', value: stats.topTag, icon: '🏷' },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: '1.25rem 1.5rem' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{s.icon}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.5rem', lineHeight: 1 }}>{s.value}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Weekly AI Summary */}
        <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem', borderLeft: '3px solid var(--brand)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: summary ? '0.75rem' : 0 }}>
            <div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>✦ AI Weekly Trends</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginLeft: '0.5rem' }}>Top themes from the last 7 days</span>
            </div>
            <button className="btn-secondary" style={{ padding: '0.4rem 0.875rem', fontSize: '0.8125rem' }} onClick={loadSummary} disabled={summaryLoading}>
              {summaryLoading ? 'Generating…' : summary ? 'Refresh' : 'Generate'}
            </button>
          </div>
          {summary && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.7 }}>{summary}</p>}
        </div>

        {/* Search + Filters */}
        <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr', gap: '0.75rem', alignItems: 'end' }}>
            {/* Search */}
            <div>
              <label className="label" style={{ fontSize: '0.75rem' }}>Search</label>
              <input
                className="input-field"
                style={{ padding: '0.5rem 0.875rem', fontSize: '0.875rem' }}
                placeholder="Search by title or summary…"
                value={filters.search}
                onChange={e => handleFilterChange('search', e.target.value)}
              />
            </div>
            {/* Category */}
            <div>
              <label className="label" style={{ fontSize: '0.75rem' }}>Category</label>
              <select className="input-field" style={{ padding: '0.5rem 0.875rem', fontSize: '0.875rem' }} value={filters.category} onChange={e => handleFilterChange('category', e.target.value)}>
                <option value="">All</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {/* Status */}
            <div>
              <label className="label" style={{ fontSize: '0.75rem' }}>Status</label>
              <select className="input-field" style={{ padding: '0.5rem 0.875rem', fontSize: '0.875rem' }} value={filters.status} onChange={e => handleFilterChange('status', e.target.value)}>
                <option value="">All</option>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {/* Sentiment */}
            <div>
              <label className="label" style={{ fontSize: '0.75rem' }}>Sentiment</label>
              <select className="input-field" style={{ padding: '0.5rem 0.875rem', fontSize: '0.875rem' }} value={filters.sentiment} onChange={e => handleFilterChange('sentiment', e.target.value)}>
                <option value="">All</option>
                <option value="Positive">Positive</option>
                <option value="Neutral">Neutral</option>
                <option value="Negative">Negative</option>
              </select>
            </div>
            {/* Sort */}
            <div>
              <label className="label" style={{ fontSize: '0.75rem' }}>Sort by</label>
              <select className="input-field" style={{ padding: '0.5rem 0.875rem', fontSize: '0.875rem' }} value={filters.sortBy} onChange={e => handleFilterChange('sortBy', e.target.value)}>
                <option value="createdAt">Date</option>
                <option value="ai_priority">Priority</option>
                <option value="ai_sentiment">Sentiment</option>
              </select>
            </div>
            {/* Order */}
            <div>
              <label className="label" style={{ fontSize: '0.75rem' }}>Order</label>
              <select className="input-field" style={{ padding: '0.5rem 0.875rem', fontSize: '0.875rem' }} value={filters.order} onChange={e => handleFilterChange('order', e.target.value)}>
                <option value="desc">↓ Desc</option>
                <option value="asc">↑ Asc</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main grid: table + detail panel */}
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: '1rem', alignItems: 'start' }}>
          {/* Table */}
          <div className="card" style={{ overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--brand)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
                Loading feedback…
              </div>
            ) : items.length === 0 ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No feedback found. Try adjusting your filters.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Title', 'Category', 'Sentiment', 'Priority', 'Status', 'Date'].map(h => (
                      <th key={h} style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr
                      key={item._id}
                      onClick={() => setSelected(selected?._id === item._id ? null : item)}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        cursor: 'pointer',
                        background: selected?._id === item._id ? 'var(--brand-light)' : 'transparent',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => { if (selected?._id !== item._id) (e.currentTarget as HTMLTableRowElement).style.background = 'var(--bg)'; }}
                      onMouseLeave={e => { if (selected?._id !== item._id) (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '0.875rem 1rem', maxWidth: 220 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                        {item.ai_summary && <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.ai_summary}</div>}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{item.category}</span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>{sentimentBadge(item.ai_sentiment)}</td>
                      <td style={{ padding: '0.875rem 1rem' }}>{priorityBar(item.ai_priority)}</td>
                      <td style={{ padding: '0.875rem 1rem' }}>{statusBadge(item.status)}</td>
                      <td style={{ padding: '0.875rem 1rem', whiteSpace: 'nowrap', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{fmtDate(item.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  {pagination.total} results · Page {pagination.page} of {pagination.pages}
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn-secondary" style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}
                    disabled={pagination.page <= 1} onClick={() => handlePageChange(pagination.page - 1)}>← Prev</button>
                  <button className="btn-secondary" style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}
                    disabled={pagination.page >= pagination.pages} onClick={() => handlePageChange(pagination.page + 1)}>Next →</button>
                </div>
              </div>
            )}
          </div>

          {/* Detail panel */}
          {selected && (
            <div className="card animate-slide-up" style={{ padding: '1.5rem', position: 'sticky', top: 76 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>Detail</h3>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.25rem', lineHeight: 1 }}>×</button>
              </div>

              <h4 style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.5rem', lineHeight: 1.4 }}>{selected.title}</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.65, marginBottom: '1rem' }}>{selected.description}</p>

              {/* Meta */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem', marginBottom: '1.25rem' }}>
                {[
                  { label: 'Category', value: selected.category },
                  { label: 'Submitted', value: fmtDate(selected.createdAt) },
                  selected.submitterName ? { label: 'From', value: selected.submitterName } : null,
                  selected.submitterEmail ? { label: 'Email', value: selected.submitterEmail } : null,
                ].filter(Boolean).map((m) => m && (
                  <div key={m.label}>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '0.2rem' }}>{m.label}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{m.value}</div>
                  </div>
                ))}
              </div>

              {/* AI section */}
              <div style={{ background: 'var(--bg)', borderRadius: 12, padding: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--brand)', fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '0.75rem' }}>✦ AI Analysis</div>
                {selected.ai_processed ? (
                  <>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                      {sentimentBadge(selected.ai_sentiment)}
                      {selected.ai_priority !== undefined && (
                        <span className="badge" style={{ background: '#fff7ed', color: '#92400e' }}>Priority {selected.ai_priority}/10</span>
                      )}
                    </div>
                    {selected.ai_summary && <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '0.75rem' }}>{selected.ai_summary}</p>}
                    {selected.ai_tags && selected.ai_tags.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                        {selected.ai_tags.map(tag => (
                          <span key={tag} style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 999, color: 'var(--text-secondary)' }}>{tag}</span>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Analysis pending…</p>
                )}
              </div>

              {/* Status update */}
              <div style={{ marginBottom: '1rem' }}>
                <label className="label" style={{ fontSize: '0.8rem' }}>Update status</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {['New', 'In Review', 'Resolved'].map(s => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(selected._id, s)}
                      disabled={selected.status === s || actionLoading === selected._id + s}
                      style={{
                        flex: 1,
                        padding: '0.5rem 0.25rem',
                        borderRadius: 8,
                        border: `1.5px solid ${selected.status === s ? 'var(--brand)' : 'var(--border)'}`,
                        background: selected.status === s ? 'var(--brand)' : 'var(--bg)',
                        color: selected.status === s ? 'white' : 'var(--text-secondary)',
                        fontSize: '0.75rem',
                        fontFamily: 'var(--font-display)',
                        fontWeight: 600,
                        cursor: selected.status === s ? 'default' : 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn-secondary"
                  style={{ flex: 1, fontSize: '0.8125rem', padding: '0.5rem' }}
                  onClick={() => handleReanalyse(selected._id)}
                  disabled={actionLoading === selected._id + 'ai'}
                >
                  {actionLoading === selected._id + 'ai' ? '…' : '↻ Re-analyse'}
                </button>
                <button
                  onClick={() => handleDelete(selected._id)}
                  disabled={actionLoading === selected._id + 'del'}
                  style={{ padding: '0.5rem 0.875rem', borderRadius: 10, border: '1.5px solid #fca5a5', background: 'var(--error-bg)', color: 'var(--error)', fontSize: '0.8125rem', fontFamily: 'var(--font-display)', fontWeight: 600, cursor: 'pointer' }}
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
