import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import EmotionBars from '../components/EmotionBars';
import StreakBadge from '../components/StreakBadge';
import { getMilestoneLabel, MILESTONES } from '../components/StreakBadge';

const EMOTION_EMOJI = {
  joy:      '😊', sadness:  '😢', anger: '😠',
  fear:     '😨', surprise: '😲', disgust: '🤢', neutral: '😐',
};

const EMOTION_LABEL = {
  joy:      'Joy',     sadness:  'Sadness',  anger:   'Anger',
  fear:     'Fear',    surprise: 'Surprise', disgust: 'Disgust', neutral: 'Neutral',
};

export default function MoodResult() {
  const { state }   = useLocation();
  const navigate    = useNavigate();

  // Guard: if navigated directly without state, redirect home
  if (!state?.entry) {
    return (
      <div className="page" style={{ alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>No entry data found.</p>
          <Link to="/" className="btn btn-ghost">← Go home</Link>
        </div>
      </div>
    );
  }

  const { entry, streak } = state;
  const emotion           = entry.dominantEmotion || 'neutral';
  const score             = entry.dominantScore   || 0;
  const emoji             = EMOTION_EMOJI[emotion]  || '●';
  const label             = EMOTION_LABEL[emotion]  || emotion;
  const pct               = Math.round(score * 100);

  // Streak milestone check
  const currentStreak     = streak?.current || 0;
  const milestoneLabel    = getMilestoneLabel(currentStreak);
  const justHitMilestone  = MILESTONES.includes(currentStreak);

  return (
    <div className="page">
      <div className="container main-content">

        {/* Result card */}
        <div className={`card fade-up emotion-bg-${emotion}`} style={{ marginBottom: 20, textAlign: 'center', padding: '40px 28px' }}>
          <div style={{ fontSize: 64, marginBottom: 12, lineHeight: 1 }}>{emoji}</div>
          <div style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
            Dominant emotion detected
          </div>
          <h1 className={`page-title emotion-${emotion}`} style={{ fontSize: 36, marginBottom: 8 }}>
            {label}
          </h1>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Confidence: <span style={{ fontWeight: 600, color: 'var(--text)' }}>{pct}%</span>
          </div>
        </div>

        {/* Streak milestone toast */}
        {justHitMilestone && (
          <div className="card fade-up" style={{
            background: 'rgba(240,153,59,0.1)',
            borderColor: 'rgba(240,153,59,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginBottom: 20,
          }}>
            <span style={{ fontSize: 28 }}>🏅</span>
            <div>
              <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, color: 'var(--amber-light)' }}>
                {milestoneLabel} — {currentStreak} day streak!
              </div>
              <div style={{ fontSize: 12, color: 'var(--amber)', marginTop: 2 }}>
                You've journaled {currentStreak} days in a row. Keep it up!
              </div>
            </div>
          </div>
        )}

        {/* Two-column: bars + insight */}
        <div className="grid-2 fade-up fade-up-1">

          {/* Emotion breakdown */}
          <div className="card">
            <h3 style={{ fontSize: 14, fontFamily: 'var(--font-head)', marginBottom: 18, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
              Emotion breakdown
            </h3>
            <EmotionBars emotions={entry.emotions} highlight={emotion} />
          </div>

          {/* Insight + meta */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Insight card */}
            {entry.insight && (
              <div className="card" style={{ flex: 1 }}>
                <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 14, fontWeight: 600 }}>
                  💡 Insight
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--text)' }}>
                  {entry.insight}
                </p>
              </div>
            )}

            {/* Mood tag + streak */}
            <div className="card card-sm" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Mood tag</div>
                <div style={{ fontSize: 14, marginTop: 4, color: 'var(--text)' }}>
                  {entry.moodTag || <span style={{ color: 'var(--text-faint)', fontStyle: 'italic' }}>none</span>}
                </div>
              </div>
              <StreakBadge streak={currentStreak} showLabel />
            </div>

            {/* Your entry preview */}
            <div className="card card-sm">
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Entry preview</div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.55, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                {entry.text}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="fade-up fade-up-2" style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Write another →
          </button>
          <button className="btn btn-ghost" onClick={() => navigate('/dashboard')}>
            View dashboard
          </button>
          <button className="btn btn-ghost" onClick={() => navigate('/history')}>
            Entry history
          </button>
        </div>
      </div>
    </div>
  );
}
