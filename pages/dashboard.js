import { useState, useEffect } from "react";
import Head from "next/head";

const PERIODS = [
  { label: "7 days", value: "7" },
  { label: "30 days", value: "30" },
  { label: "All time", value: "all" },
];

function TrendBadge({ trend, rate, prevRate }) {
  if (trend === "up") return <span style={{ color: "#2D6A4F", fontSize: "0.78rem", fontWeight: 600 }}>↑ up</span>;
  if (trend === "down") return <span style={{ color: "#991b1b", fontSize: "0.78rem", fontWeight: 600 }}>↓ down</span>;
  return <span style={{ color: "rgba(28,25,23,0.4)", fontSize: "0.78rem" }}>→ flat</span>;
}

function MetricCard({ metric }) {
  return (
    <div style={{
      background: "#fff",
      border: "1px solid rgba(28,25,23,0.1)",
      borderRadius: 8,
      padding: "1.25rem",
      display: "flex",
      flexDirection: "column",
      gap: "0.4rem",
    }}>
      <div style={{ fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(28,25,23,0.4)" }}>
        Stage {metric.stage} · {metric.label}
      </div>
      <div style={{ fontSize: "2rem", fontWeight: 700, fontFamily: "Georgia, serif", color: "#1C1917", lineHeight: 1 }}>
        {metric.value.toLocaleString()}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
        <TrendBadge trend={metric.trend} />
        {metric.rate !== undefined && (
          <span style={{ fontSize: "0.78rem", color: "rgba(28,25,23,0.5)" }}>
            {metric.rate}% rate
          </span>
        )}
        {metric.extra && (
          <span style={{ fontSize: "0.78rem", color: "rgba(28,25,23,0.5)" }}>
            👍 {metric.extra.up} · 👎 {metric.extra.down}
          </span>
        )}
      </div>
    </div>
  );
}

function FunnelBar({ metrics }) {
  const max = Math.max(...metrics.map(m => m.value), 1);
  return (
    <div style={{ background: "#fff", border: "1px solid rgba(28,25,23,0.1)", borderRadius: 8, padding: "1.5rem", marginBottom: "1rem" }}>
      <div style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(28,25,23,0.4)", marginBottom: "1.25rem" }}>
        Funnel
      </div>
      {metrics.map((m, i) => (
        <div key={m.id} style={{ marginBottom: "0.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem" }}>
            <span style={{ fontSize: "0.83rem", color: "#1C1917" }}>{m.label}</span>
            <span style={{ fontSize: "0.83rem", fontWeight: 600, color: "#1C1917" }}>{m.value.toLocaleString()}</span>
          </div>
          <div style={{ background: "rgba(28,25,23,0.06)", borderRadius: 4, height: 8, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              borderRadius: 4,
              background: i === 0 ? "#C96A1A" : "#2D6A4F",
              width: `${Math.max((m.value / max) * 100, m.value > 0 ? 2 : 0)}%`,
              transition: "width 0.5s ease",
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function BottleneckCard({ bottleneck }) {
  return (
    <div style={{
      background: "rgba(185,28,28,0.05)",
      border: "1.5px solid rgba(185,28,28,0.2)",
      borderRadius: 8,
      padding: "1.25rem 1.5rem",
      marginBottom: "1.5rem",
    }}>
      <div style={{ fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#991b1b", marginBottom: "0.4rem" }}>
        Biggest drop-off
      </div>
      <div style={{ fontSize: "1rem", fontWeight: 600, color: "#1C1917", marginBottom: "0.3rem" }}>
        {bottleneck.from} → {bottleneck.to}: {bottleneck.dropPct}% fall-off
      </div>
      <div style={{ fontSize: "0.88rem", color: "rgba(28,25,23,0.7)", lineHeight: 1.5 }}>
        ✦ {bottleneck.suggestion}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [period, setPeriod] = useState("30");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(`/api/dashboard?period=${period}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [period]);

  return (
    <>
      <Head>
        <title>SimpleAI — Funnel Dashboard</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;500&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body {
          font-family: 'Source Sans 3', sans-serif;
          background: #F5F5F2;
          color: #1C1917;
          font-size: 16px;
          -webkit-font-smoothing: antialiased;
        }
      `}</style>

      <div style={{ minHeight: "100vh" }}>
        {/* Header */}
        <div style={{ background: "#1C1917", padding: "1rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <span style={{ fontFamily: "Georgia, serif", fontSize: "1.1rem", color: "#fff" }}>Simple<span style={{ color: "#C96A1A" }}>AI</span></span>
            <span style={{ marginLeft: "0.75rem", fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Funnel Dashboard</span>
          </div>
          {data && (
            <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)" }}>
              Updated {new Date(data.updatedAt).toLocaleTimeString()}
            </span>
          )}
        </div>

        <div style={{ maxWidth: 960, margin: "0 auto", padding: "2rem 1.5rem" }}>

          {/* Period filter */}
          <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.75rem" }}>
            {PERIODS.map(p => (
              <button key={p.value} onClick={() => setPeriod(p.value)} style={{
                padding: "0.45rem 1rem",
                border: "1.5px solid",
                borderColor: period === p.value ? "#C96A1A" : "rgba(28,25,23,0.15)",
                borderRadius: 6,
                background: period === p.value ? "rgba(201,106,26,0.08)" : "#fff",
                color: period === p.value ? "#C96A1A" : "rgba(28,25,23,0.6)",
                fontFamily: "inherit",
                fontSize: "0.85rem",
                fontWeight: period === p.value ? 600 : 400,
                cursor: "pointer",
                transition: "all 0.15s",
              }}>
                {p.label}
              </button>
            ))}
          </div>

          {loading && (
            <div style={{ textAlign: "center", padding: "4rem", color: "rgba(28,25,23,0.4)" }}>Loading…</div>
          )}

          {error && (
            <div style={{ background: "rgba(185,28,28,0.06)", border: "1px solid rgba(185,28,28,0.2)", borderRadius: 8, padding: "1rem", color: "#991b1b", marginBottom: "1rem" }}>
              Error: {error}
            </div>
          )}

          {data && !loading && (
            <>
              {/* Bottleneck callout */}
              <BottleneckCard bottleneck={data.bottleneck} />

              {/* Funnel bar chart */}
              <FunnelBar metrics={data.metrics} />

              {/* Metric cards grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "0.75rem" }}>
                {data.metrics.map(m => <MetricCard key={m.id} metric={m} />)}
              </div>

              {/* Footer note */}
              <div style={{ marginTop: "2rem", fontSize: "0.78rem", color: "rgba(28,25,23,0.35)", textAlign: "center", lineHeight: 1.6 }}>
                Email data: Brevo · Feedback & usage: Supabase · Page views: <a href="https://vercel.com/analytics" target="_blank" rel="noopener" style={{ color: "#C96A1A" }}>Vercel Analytics</a>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
