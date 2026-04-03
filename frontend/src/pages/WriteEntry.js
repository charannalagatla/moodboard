import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEntry } from '../api';
import { useAuth } from '../context/AuthContext';
import StreakBadge from '../components/StreakBadge';

const MOOD_TAGS = ['happy', 'sad', 'anxious', 'angry', 'calm', 'excited', 'neutral'];

const PROMPTS = [
  "What's on your mind today?",
  "How are you feeling right now?",
  "What happened today that stood out?",
  "Describe your emotional state in a few words…",
  "What's been weighing on you lately?",
  "Write freely — no one else can see this.",
];

export default function WriteEntry() {
  const [text, setText]         = useState('');
  const [moodTag, setMoodTag]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const { user, refreshUser }   = useAuth();
  const navigate                = useNavigate();

  const placeholder = PROMPTS[new Date().getDay() % PROMPTS.length];
  const charCount   = text.length;
  const charLimit   = 5000;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setError('');
    setLoading(true);
    try {
      const { data } = await createEntry({ text: text.trim(), moodTag });
      await refreshUser();
      navigate('/result', { state: { entry: data.entry, streak: data.streak } });
    } catch (err) {
      setError(err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || 'Failed to save entry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="container main-content">
        {/* Header */}
        <div className="page-header fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="page-title">
              Hey, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="page-sub">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <StreakBadge streak={user?.streak?.current || 0} showLabel />
        </div>

        {/* Entry form */}
        <div className="card fade-up fade-up-1">
          <form onSubmit={onSubmit}>
            {error && (
              <div style={{
                background: 'rgba(240,119,119,0.1)',
                border: '1px solid rgba(240,119,119,0.25)',
                borderRadius: 8,
                padding: '10px 14px',
                marginBottom: 18,
                fontSize: 13,
                color: '#f09090',
              }}>
                {error}
              </div>
            )}

            {/* Text area */}
            <div className="form-group">
              <label>Today's entry</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={placeholder}
                maxLength={charLimit}
                style={{ minHeight: 200, fontSize: 15, lineHeight: 1.7 }}
                autoFocus
              />
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                fontSize: 11,
                marginTop: 6,
                color: charCount > charLimit * 0.9 ? 'var(--amber)' : 'var(--text-faint)',
              }}>
                {charCount} / {charLimit}
              </div>
            </div>

            {/* Mood tag */}
            <div className="form-group">
              <label>Tag your mood <span style={{ textTransform: 'none', opacity: 0.5 }}>(optional)</span></label>
              <div className="mood-tags">
                {MOOD_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={`mood-tag ${moodTag === tag ? 'active' : ''}`}
                    onClick={() => setMoodTag(moodTag === tag ? '' : tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div style={{ display: 'flex', gap: 12, marginTop: 8, justifyContent: 'flex-end' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !text.trim()}
              >
                {loading ? (
                  <>
                    <span className="spinner" />
                    Analysing your mood…
                  </>
                ) : (
                  <>
                    Analyse & save →
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Stats row */}
        <div className="grid-3 fade-up fade-up-2" style={{ marginTop: 24 }}>
          <div className="card card-sm" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--indigo-light)', fontFamily: 'var(--font-head)' }}>
              {user?.totalEntries || 0}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Total entries
            </div>
          </div>
          <div className="card card-sm" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--teal)', fontFamily: 'var(--font-head)' }}>
              {user?.streak?.current || 0}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Day streak
            </div>
          </div>
          <div className="card card-sm" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--amber)', fontFamily: 'var(--font-head)' }}>
              {user?.streak?.longest || 0}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Best streak
            </div>
          </div>
        </div>

        {/* ML notice */}
        <p className="fade-up fade-up-3" style={{
          marginTop: 20,
          fontSize: 11,
          color: 'var(--text-faint)',
          textAlign: 'center',
          letterSpacing: '0.03em',
        }}>
          Your entry is analysed privately using AI emotion detection · Entries are visible only to you
        </p>
      </div>
    </div>
  );
}
