import React from 'react';

export default function InsightCard({ insight, delay = 0 }) {
  if (!insight) return null;

  const typeStyles = {
    pattern:  { borderColor: 'rgba(108,99,220,0.3)',  background: 'rgba(108,99,220,0.06)' },
    positive: { borderColor: 'rgba(93,202,165,0.3)',  background: 'rgba(93,202,165,0.06)'  },
    care:     { borderColor: 'rgba(116,179,255,0.3)', background: 'rgba(116,179,255,0.06)' },
  };

  const style = typeStyles[insight.type] || typeStyles.pattern;

  return (
    <div
      className="insight-card"
      style={{
        ...style,
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="insight-icon">{insight.icon}</div>
      <p className="insight-text">{insight.text}</p>
    </div>
  );
}
