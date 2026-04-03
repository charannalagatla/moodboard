import React from 'react';

const EMOTION_COLORS = {
  joy:      '#ffd166',
  sadness:  '#74b3ff',
  anger:    '#ff6b6b',
  fear:     '#c77dff',
  surprise: '#f9844a',
  disgust:  '#95d5b2',
  neutral:  '#adb5bd',
};

const EMOTION_EMOJI = {
  joy:      '😊',
  sadness:  '😢',
  anger:    '😠',
  fear:     '😨',
  surprise: '😲',
  disgust:  '🤢',
  neutral:  '😐',
};

export default function EmotionBars({ emotions = [], highlight }) {
  if (!emotions.length) return null;

  const sorted = [...emotions].sort((a, b) => b.score - a.score);

  return (
    <div>
      {sorted.map(({ label, score }) => {
        const color  = EMOTION_COLORS[label] || '#aaa';
        const emoji  = EMOTION_EMOJI[label] || '●';
        const pct    = Math.round(score * 100);
        const isTop  = label === highlight;

        return (
          <div key={label} className="score-bar-wrap" style={{ opacity: isTop ? 1 : 0.6, transition: 'opacity 0.2s' }}>
            <div className="score-bar-label">
              <span>
                {emoji} {label}
                {isTop && <span style={{ color, marginLeft: 6, fontSize: 10 }}>▲ dominant</span>}
              </span>
              <span style={{ color, fontWeight: 500 }}>{pct}%</span>
            </div>
            <div className="score-bar-track">
              <div
                className="score-bar-fill"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${color}99, ${color})`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export { EMOTION_COLORS, EMOTION_EMOJI };
