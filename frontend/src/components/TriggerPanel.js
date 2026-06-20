import React, { useState, useEffect } from 'react';
import { getTriggers } from '../api';

const EMOTION_LABELS = {
  anger: 'Anger',
  sadness: 'Sadness',
  fear: 'Fear',
  disgust: 'Disgust',
};

export default function TriggerPanel() {
  const [triggers, setTriggers] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await getTriggers();
        if (active) setTriggers(data.triggers);
      } catch (err) {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const activeEmotions = triggers
    ? Object.keys(EMOTION_LABELS).filter((key) => (triggers[key] || []).length > 0)
    : [];

  const hasAnyData = activeEmotions.length > 0;

  return (
    <div
      className="fade-up fade-up-1"
      style={{
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '18px 22px',
      }}
    >
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: 13,
        color: 'var(--text-muted)',
        margin: 0,
        lineHeight: 1.6,
      }}>
        Words that have shown up around tougher moments before. Just something to notice as you write.
      </p>

      {!loading && error && (
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 12,
          color: 'var(--text-faint)',
          margin: '14px 0 0',
        }}>
          Couldn't load this right now.
        </p>
      )}

      {!loading && !error && !hasAnyData && (
        <div className="empty-state" style={{ padding: '24px 0 4px' }}>
          <p style={{ fontSize: 13, margin: 0 }}>
            Patterns show up after a few entries. Write your first one to begin noticing.
          </p>
        </div>
      )}

      {!loading && !error && hasAnyData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
          {activeEmotions.map((emotion) => (
            <div
              key={emotion}
              className={`emotion-${emotion}`}
              style={{
                borderLeft: '2px solid currentColor',
                borderRadius: 0,
                paddingLeft: 12,
              }}
            >
              <p className={`emotion-${emotion}`} style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                margin: '0 0 5px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                {EMOTION_LABELS[emotion]}
              </p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {triggers[emotion].map((item) => (
                <span
                    key={item.word}
                    className={`emotion-${emotion} emotion-bg-${emotion}`}
                    style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 13,
                    padding: '3px 10px',
                    borderRadius: 20,
                    border: '1px solid',
                    borderColor: 'currentColor',
                    }}
                >
                    {item.word}
                </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}