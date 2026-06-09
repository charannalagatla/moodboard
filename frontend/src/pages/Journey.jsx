import { useEffect, useState, useMemo } from "react";
import { getJourney } from "../api";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const EMOTIONS = [
  { key: "joy",      color: "#b8952a" },
  { key: "sadness",  color: "#5a7aa0" },
  { key: "anger",    color: "#b05a5a" },
  { key: "fear",     color: "#8a6aaa" },
  { key: "surprise", color: "#c07840" },
  { key: "disgust",  color: "#5a8f72" },
  { key: "neutral",  color: "#7a5c40" },
];

const EMOTION_EMOJI = {
  joy: "😊", sadness: "😔", anger: "😤",
  fear: "😰", surprise: "😲", disgust: "😒", neutral: "😐",
};

function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function deriveMetrics(data) {
  if (!data || data.length === 0) return null;

  // ── Step 1: sum every emotion across all months ──────────────
  const totals = {};
  EMOTIONS.forEach(({ key }) => { totals[key] = 0; });
  data.forEach((month) => {
    EMOTIONS.forEach(({ key }) => { totals[key] += month[key] || 0; });
  });

  // ── Dominant emotion ─────────────────────────────────────────
  const dominantEmotion = Object.entries(totals).sort((a, b) => b[1] - a[1])[0][0];

  // ── Total entries ────────────────────────────────────────────
  const totalEntries = Object.values(totals).reduce((a, b) => a + b, 0);

  const monthsTracked = data.length;

  // ── Emotional balance (your formula) ────────────────────────
  // positiveTotal / negativeTotal across all months
  const positiveTotal = (totals.joy || 0) + (totals.surprise || 0);
  const negativeTotal = (totals.sadness || 0) + (totals.anger || 0) + (totals.fear || 0) + (totals.disgust || 0);
  const balanceRatio  = negativeTotal > 0 ? positiveTotal / negativeTotal : positiveTotal > 0 ? 2 : 1;
  const balanceLabel  = balanceRatio > 1.2 ? "Mostly positive" : balanceRatio < 0.8 ? "Mostly negative" : "Balanced";

  // ── Habit strength (your formula) ───────────────────────────
  // entriesPerDay = totalEntries / (monthsTracked * 30)
  const entriesPerDay   = totalEntries / (monthsTracked * 30);
  const habitLabel      = entriesPerDay >= 1 ? "Daily journaler"
                        : entriesPerDay >= 0.25 ? "Regular journaler"
                        : "Occasional journaler";

  // ── Trend direction ──────────────────────────────────────────
  // Compare last 2 months: positive emotions up or down?
  let trendLabel = null;
  if (data.length >= 2) {
    const last    = data[data.length - 1];
    const prev    = data[data.length - 2];
    const lastPos = (last.joy || 0) + (last.surprise || 0);
    const prevPos = (prev.joy || 0) + (prev.surprise || 0);
    const lastNeg = (last.sadness || 0) + (last.anger || 0) + (last.fear || 0) + (last.disgust || 0);
    const prevNeg = (prev.sadness || 0) + (prev.anger || 0) + (prev.fear || 0) + (prev.disgust || 0);

    if (lastPos > prevPos && lastNeg <= prevNeg)      trendLabel = "Improving ↑";
    else if (lastNeg > prevNeg && lastPos <= prevPos) trendLabel = "Declining ↓";
    else                                               trendLabel = "Stable →";
  }

  // ── Summary sentence (computed, no AI) ──────────────────────
  const dominantDescriptions = {
    joy:      "Joy has been your most frequent emotional state.",
    sadness:  "Sadness has shown up most in your journey — you're processing deeply.",
    anger:    "Anger has been a recurring theme — often a signal of unmet needs.",
    fear:     "Fear has appeared most in your writing — naming it is already brave.",
    surprise: "Surprise has dominated — life has been unpredictable for you.",
    disgust:  "Disgust has featured heavily — your values are clearly important to you.",
    neutral:  "You've been steady and measured — emotional stability is your foundation.",
  };

  const balanceLine = balanceRatio > 1.2
    ? "Your emotional balance leans positive overall."
    : balanceRatio < 0.8
    ? "Your emotional balance has leaned negative — be gentle with yourself."
    : "Your positive and negative emotions are fairly balanced.";

  const habitLine = entriesPerDay >= 1
    ? `You're writing daily — that consistency is what makes pattern detection possible.`
    : entriesPerDay >= 0.25
    ? `You journal regularly. Keep going — more data reveals deeper patterns.`
    : `You journal occasionally. Even irregular entries build your emotional picture over time.`;

  const summary = `${dominantDescriptions[dominantEmotion]} ${balanceLine} ${habitLine}`;

  return {
    dominantEmotion,
    totalEntries,
    monthsTracked,
    balanceLabel,
    balanceRatio: Number(balanceRatio.toFixed(2)),
    habitLabel,
    entriesPerDay: Number(entriesPerDay.toFixed(2)),
    trendLabel,
    summary,
  };
}

export default function Journey() {
  const [journeyData, setJourneyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getJourney();
        setJourneyData(res.data);
        localStorage.setItem('mb_months_tracked', res.data.length);
      } catch (err) {
        setError("Could not load your journey. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const metrics = useMemo(() => deriveMetrics(journeyData), [journeyData]);

  if (loading) {
    return (
      <div className="page">
        <div className="container main-content">
          <div className="empty-state">
            <div className="spinner" style={{ width: 28, height: 28, margin: "0 auto 16px" }} />
            <p>Loading your emotional journey…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="container main-content">
          <div className="error-banner">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container main-content">

        {/* Page header */}
        <div className="page-header">
          <h1 className="page-title">Emotional Journey</h1>
          <p className="page-sub">Your emotional story, month by month.</p>
        </div>

        {/* Metrics cards */}
        {metrics && (
          <div className="grid-3" style={{ marginBottom: 28 }}>

            <div className="card card-sm" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>
                {EMOTION_EMOJI[metrics.dominantEmotion]}
              </div>
              <div style={{ fontFamily: "var(--font-head)", fontSize: 24, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.02em" }}>
                {capitalize(metrics.dominantEmotion)}
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
                Most frequent emotion
              </div>
            </div>

            <div className="card card-sm" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>📝</div>
              <div style={{ fontFamily: "var(--font-head)", fontSize: 24, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.02em" }}>
                {metrics.totalEntries}
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
                Total entries
              </div>
            </div>

            <div className="card card-sm" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>📅</div>
              <div style={{ fontFamily: "var(--font-head)", fontSize: 24, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.02em" }}>
                {metrics.monthsTracked}
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
                {metrics.monthsTracked === 1 ? "Month tracked" : "Months tracked"}
              </div>
            </div>

          </div>
        )}

        {/* Journey summary */}
        {metrics && (
          <div className="card" style={{ marginBottom: 24, borderLeft: "3px solid var(--accent)" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.09em", color: "var(--accent)", marginBottom: 10 }}>
              Journey summary
            </div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 15, lineHeight: 1.75, color: "var(--text)", marginBottom: 16 }}>
              {metrics.summary}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 20, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-faint)" }}>
              <span>⚖️ {metrics.balanceLabel}</span>
              <span>✍️ {metrics.habitLabel}</span>
              {metrics.trendLabel && <span>📈 Trend: {metrics.trendLabel}</span>}
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="card">
          <div style={{ width: "100%", height: 400 }}>
            <ResponsiveContainer>
              <LineChart data={journeyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontFamily: "var(--font-mono)", fontSize: 11, fill: "var(--text-faint)" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontFamily: "var(--font-mono)", fontSize: 11, fill: "var(--text-faint)" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontFamily: "var(--font-body)", fontSize: 13, paddingTop: 16 }} />
                {EMOTIONS.map(({ key, color }) => (
                  <Line key={key} type="monotone" dataKey={key} stroke={color} strokeWidth={2} dot={{ r: 3, fill: color, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}