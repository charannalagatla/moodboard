import React, { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from 'recharts';
import { getDashboard } from '../api';
import InsightCard from '../components/InsightCard';
import { EMOTION_COLORS, EMOTION_EMOJI } from '../components/EmotionBars';

// ── Custom tooltip ────────────────────────────────────────────
function MoodTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div style={{
      background: 'var(--bg2)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: '10px 14px',
      fontSize: 12,
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ color: EMOTION_COLORS[d?.topEmotion] || '#aaa', fontWeight: 600 }}>
        {EMOTION_EMOJI[d?.topEmotion]} {d?.topEmotion}
      </div>
      {d?.count && <div style={{ color: 'var(--text-faint)', marginTop: 2 }}>{d.count} entr{d.count === 1 ? 'y' : 'ies'}</div>}
    </div>
  );
}

function ScoreTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg2)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: '10px 14px',
      fontSize: 12,
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ color: 'var(--indigo-light)', fontWeight: 600 }}>
        Score: {(payload[0].value * 100).toFixed(0)}%
      </div>
      <div style={{ color: 'var(--text-faint)', marginTop: 2 }}>
        {EMOTION_EMOJI[payload[0]?.payload?.dominantEmotion]} {payload[0]?.payload?.dominantEmotion}
      </div>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────
function StatCard({ value, label, color, icon }) {
  return (
    <div className="card card-sm" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 28, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color, fontFamily: 'var(--font-head)', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {label}
      </div>
    </div>
  );
}

// ── Format date label ─────────────────────────────────────────
function fmtDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function Dashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: d } = await getDashboard();
      setData(d);
    } catch (err) {
      setError('Could not load dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="page" style={{ alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: 32, height: 32, color: 'var(--indigo-light)', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="container main-content">
          <div className="empty-state">
            <div className="empty-icon">⚠️</div>
            <h3>Couldn't load data</h3>
            <p>{error}</p>
            <button className="btn btn-ghost" onClick={load}>Try again</button>
          </div>
        </div>
      </div>
    );
  }

  const { dailyMoods = [], emotionFrequency = [], weekTrend = [], patternInsights = [] } = data || {};
  const topEmotion = emotionFrequency[0];
  const totalEntries = emotionFrequency.reduce((s, e) => s + e.count, 0);
  const daysTracked = dailyMoods.length;

  // Prepare bar chart data — assign colour per day based on dominant emotion
  const barData = dailyMoods.map(d => ({
    ...d,
    date: fmtDate(d._id),
    fill: EMOTION_COLORS[d.topEmotion] || '#adb5bd',
  }));

  // Pie chart data
  const pieData = emotionFrequency.map(e => ({
    name: e._id,
    value: e.count,
    fill: EMOTION_COLORS[e._id] || '#adb5bd',
  }));

  // Line chart
  const lineData = weekTrend.map(d => ({
    ...d,
    date: fmtDate(d._id),
    avgScore: parseFloat(d.avgScore.toFixed(3)),
  }));

  const isEmpty = totalEntries === 0;

  return (
    <div className="page">
      <div className="container main-content">

        {/* Header */}
        <div className="page-header fade-up">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Your emotional patterns at a glance</p>
        </div>

        {isEmpty ? (
          <div className="empty-state fade-up">
            <div className="empty-icon">📊</div>
            <h3>No data yet</h3>
            <p>Write your first journal entry to start seeing your mood patterns here.</p>
            <a href="/" className="btn btn-primary">Write an entry →</a>
          </div>
        ) : (
          <>
            {/* Stats row */}
            <div className="grid-3 fade-up fade-up-1" style={{ marginBottom: 24 }}>
              <StatCard value={totalEntries} label="Total entries" color="var(--indigo-light)" icon="📝" />
              <StatCard value={daysTracked} label="Days tracked" color="var(--teal)" icon="📅" />
              <StatCard
                value={topEmotion ? `${EMOTION_EMOJI[topEmotion._id]} ${topEmotion._id}` : '—'}
                label="Most frequent mood"
                color={topEmotion ? EMOTION_COLORS[topEmotion._id] : 'var(--text)'}
                icon=""
              />
            </div>

            {/* Daily moods bar chart */}
            {barData.length > 0 && (
              <div className="card fade-up fade-up-1" style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 13, fontFamily: 'var(--font-head)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 20 }}>
                  Daily mood — last 30 days
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={barData} barSize={16} margin={{ left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: '#7e7c94', fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: '#7e7c94', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<MoodTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {barData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} fillOpacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Line chart + Pie chart */}
            <div className="grid-2 fade-up fade-up-2" style={{ marginBottom: 20 }}>

              {/* Emotion score trend */}
              {lineData.length > 0 && (
                <div className="card">
                  <h3 style={{ fontSize: 13, fontFamily: 'var(--font-head)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 20 }}>
                    Confidence trend — 7 days
                  </h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={lineData} margin={{ left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="date" tick={{ fill: '#7e7c94', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 1]} tickFormatter={v => `${(v * 100).toFixed(0)}%`} tick={{ fill: '#7e7c94', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ScoreTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="avgScore"
                        stroke="var(--indigo-light)"
                        strokeWidth={2}
                        dot={{ fill: 'var(--indigo-light)', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Emotion breakdown pie */}
              {pieData.length > 0 && (
                <div className="card">
                  <h3 style={{ fontSize: 13, fontFamily: 'var(--font-head)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 20 }}>
                    Emotion frequency
                  </h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        innerRadius={40}
                        paddingAngle={3}
                      >
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} fillOpacity={0.9} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val, name) => [`${val} entries`, `${EMOTION_EMOJI[name]} ${name}`]} contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                      <Legend formatter={(name) => <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{EMOTION_EMOJI[name]} {name}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Pattern insights */}
            {patternInsights.length > 0 && (
              <div className="fade-up fade-up-3">
                <h3 style={{ fontSize: 13, fontFamily: 'var(--font-head)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 14 }}>
                  Pattern insights
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {patternInsights.map((insight, i) => (
                    <InsightCard key={i} insight={insight} delay={i * 80} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
