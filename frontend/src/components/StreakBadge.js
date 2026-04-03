import React from 'react';

const MILESTONES = [3, 7, 14, 21, 30, 60, 100];

function getMilestoneLabel(streak) {
  if (streak >= 100) return '🏆 Legend';
  if (streak >= 60)  return '💎 Diamond';
  if (streak >= 30)  return '🥇 Gold';
  if (streak >= 21)  return '🥈 Silver';
  if (streak >= 14)  return '🥉 Bronze';
  if (streak >= 7)   return '⭐ Week warrior';
  if (streak >= 3)   return '🔥 On a roll';
  return null;
}

export default function StreakBadge({ streak = 0, showLabel = false }) {
  if (streak === 0) return null;

  const label = getMilestoneLabel(streak);
  const nextMilestone = MILESTONES.find((m) => m > streak);

  return (
    <div className="streak-badge" title={nextMilestone ? `${nextMilestone - streak} days to next milestone` : 'Max milestone!'}>
      <span className="streak-fire">🔥</span>
      <span>{streak} day{streak !== 1 ? 's' : ''}</span>
      {showLabel && label && (
        <span style={{ opacity: 0.75, fontSize: 11 }}>{label}</span>
      )}
    </div>
  );
}

export { getMilestoneLabel, MILESTONES };
