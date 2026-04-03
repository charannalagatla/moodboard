import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEntries, deleteEntry } from '../api';
import { EMOTION_COLORS, EMOTION_EMOJI } from '../components/EmotionBars';

function EntryCard({ entry, onDelete }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const emotion = entry.dominantEmotion;

  const handleDelete = async () => {
    if (!confirming) { setConfirming(true); return; }
    setDeleting(true);
    try {
      await deleteEntry(entry._id);
      onDelete(entry._id);
    } catch (_) {
      setDeleting(false);
      setConfirming(false);
    }
  };

  return (
    <div
      className={`card card-sm ${emotion ? `emotion-bg-${emotion}` : ''}`}
      style={{ marginBottom: 12 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Date + emotion */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>
              {new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            {emotion && (
              <span style={{
                fontSize: 11,
                padding: '2px 9px',
                borderRadius: 10,
                background: `${EMOTION_COLORS[emotion]}22`,
                color: EMOTION_COLORS[emotion],
                fontWeight: 500,
              }}>
                {EMOTION_EMOJI[emotion]} {emotion}
              </span>
            )}
            {entry.moodTag && (
              <span style={{ fontSize: 11, color: 'var(--text-faint)', background: 'var(--bg3)', padding: '2px 8px', borderRadius: 8 }}>
                #{entry.moodTag}
              </span>
            )}
          </div>

          {/* Text preview */}
          <p style={{
            fontSize: 13,
            color: 'var(--text-muted)',
            lineHeight: 1.55,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}>
            {entry.text}
          </p>

          {/* Insight */}
          {entry.insight && (
            <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 6, fontStyle: 'italic' }}>
              💡 {entry.insight}
            </p>
          )}
        </div>

        {/* Score badge */}
        {entry.dominantScore && (
          <div style={{
            textAlign: 'center',
            flexShrink: 0,
            padding: '6px 10px',
            borderRadius: 8,
            background: 'var(--bg3)',
          }}>
            <div style={{ fontSize: 18, lineHeight: 1 }}>{EMOTION_EMOJI[emotion]}</div>
            <div style={{ fontSize: 11, color: EMOTION_COLORS[emotion], fontWeight: 600, marginTop: 3 }}>
              {Math.round(entry.dominantScore * 100)}%
            </div>
          </div>
        )}
      </div>

      {/* Delete */}
      <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
        <button
          className="btn btn-danger"
          style={{ fontSize: 12, padding: '5px 12px' }}
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? '…' : confirming ? 'Confirm delete?' : 'Delete'}
        </button>
        {confirming && !deleting && (
          <button
            className="btn btn-ghost"
            style={{ fontSize: 12, padding: '5px 12px', marginLeft: 6 }}
            onClick={() => setConfirming(false)}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

export default function History() {
  const [entries, setEntries]   = useState([]);
  const [page, setPage]         = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const { data } = await getEntries(p);
      setEntries(prev => p === 1 ? data.entries : [...prev, ...data.entries]);
      setPagination(data.pagination);
      setPage(p);
    } catch (_) {
      setError('Could not load entries.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(1); }, [load]);

  const onDelete = (id) => setEntries(prev => prev.filter(e => e._id !== id));

  const hasMore = pagination && page < pagination.pages;

  return (
    <div className="page">
      <div className="container main-content">

        <div className="page-header fade-up">
          <h1 className="page-title">Entry history</h1>
          <p className="page-sub">
            {pagination ? `${pagination.total} entr${pagination.total === 1 ? 'y' : 'ies'} total` : ''}
          </p>
        </div>

        {error && (
          <div className="empty-state">
            <div className="empty-icon">⚠️</div>
            <p>{error}</p>
            <button className="btn btn-ghost" onClick={() => load(1)}>Retry</button>
          </div>
        )}

        {!loading && !error && entries.length === 0 && (
          <div className="empty-state fade-up">
            <div className="empty-icon">📓</div>
            <h3>No entries yet</h3>
            <p>Your journal is empty. Start writing to see your history here.</p>
            <a href="/" className="btn btn-primary">Write your first entry →</a>
          </div>
        )}

        <div className="fade-up fade-up-1">
          {entries.map(entry => (
            <EntryCard key={entry._id} entry={entry} onDelete={onDelete} />
          ))}
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <div className="spinner" style={{ color: 'var(--indigo-light)', margin: '0 auto' }} />
          </div>
        )}

        {hasMore && !loading && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button className="btn btn-ghost" onClick={() => load(page + 1)}>
              Load more
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
