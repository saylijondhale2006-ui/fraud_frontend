import React, { useState, useEffect, useRef } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const BACKEND_URL = "http://127.0.0.1:5000";
const FRAUD_THRESHOLD = 0.15;

/* ── Inject global styles ───────────────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:        #080b14;
    --surface:   #0d1424;
    --surface2:  #111827;
    --border:    rgba(255,255,255,0.07);
    --border2:   rgba(255,255,255,0.13);
    --accent:    #3b82f6;
    --accent2:   #6366f1;
    --danger:    #ef4444;
    --safe:      #10b981;
    --warn:      #f59e0b;
    --text:      #f1f5f9;
    --muted:     #64748b;
    --muted2:    #94a3b8;
    --mono:      'Space Mono', monospace;
    --sans:      'DM Sans', sans-serif;
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--sans);
    min-height: 100vh;
  }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }

  input[type=number]::-webkit-inner-spin-button,
  input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes scan {
    0%   { top: 0%; }
    50%  { top: 92%; }
    100% { top: 0%; }
  }
  @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0.3; } }

  .fade-up   { animation: fadeUp 0.5s 0.00s ease both; }
  .fade-up-1 { animation: fadeUp 0.5s 0.07s ease both; }
  .fade-up-2 { animation: fadeUp 0.5s 0.14s ease both; }
  .fade-up-3 { animation: fadeUp 0.5s 0.21s ease both; }
  .fade-up-4 { animation: fadeUp 0.5s 0.28s ease both; }
  .fade-up-5 { animation: fadeUp 0.5s 0.35s ease both; }

  .stat-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 22px 24px;
    display: flex;
    align-items: center;
    gap: 16px;
    transition: border-color 0.25s, transform 0.2s;
    cursor: default;
  }
  .stat-card:hover { border-color: var(--border2); transform: translateY(-2px); }

  .panel {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 28px;
    transition: border-color 0.25s;
  }
  .panel:hover { border-color: var(--border2); }

  .btn-primary {
    background: linear-gradient(135deg, var(--accent2), var(--accent));
    color: #fff;
    border: none;
    padding: 14px 30px;
    border-radius: 12px;
    font-family: var(--sans);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    letter-spacing: 0.3px;
    transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
    box-shadow: 0 4px 20px rgba(99,102,241,0.35);
    display: inline-flex; align-items: center; gap: 8px;
  }
  .btn-primary:hover:not(:disabled) { opacity:0.88; transform: translateY(-1px); }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

  .btn-secondary {
    background: transparent;
    color: var(--muted2);
    border: 1px solid var(--border2);
    padding: 14px 24px;
    border-radius: 12px;
    font-family: var(--sans);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    display: inline-flex; align-items: center; gap: 8px;
  }
  .btn-secondary:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
  .btn-secondary:disabled { opacity: 0.45; cursor: not-allowed; }

  .btn-ghost {
    background: transparent;
    color: var(--muted);
    border: 1px solid rgba(239,68,68,0.22);
    padding: 14px 20px;
    border-radius: 12px;
    font-family: var(--sans);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    display: inline-flex; align-items: center; gap: 8px;
  }
  .btn-ghost:hover { border-color: var(--danger); color: var(--danger); }

  .input-field {
    width: 100%;
    background: var(--surface2);
    border: 1px solid var(--border2);
    border-radius: 12px;
    padding: 14px 18px;
    color: var(--text);
    font-family: 'Space Mono', monospace;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    -moz-appearance: textfield;
  }
  .input-field::placeholder { color: var(--muted); font-family: var(--sans); }
  .input-field:focus {
    border-color: var(--accent2);
    box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
  }

  .risk-bar-track {
    height: 6px;
    background: rgba(255,255,255,0.07);
    border-radius: 3px;
    overflow: hidden;
    flex: 1;
    min-width: 50px;
  }
  .risk-bar-fill { height: 100%; border-radius: 3px; transition: width 0.5s ease; }

  .badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 12px; border-radius: 20px;
    font-size: 11px; font-weight: 700;
    letter-spacing: 0.5px; text-transform: uppercase;
  }
  .badge-fraud { background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.25); }
  .badge-safe  { background: rgba(16,185,129,0.12); color: #10b981; border: 1px solid rgba(16,185,129,0.2); }

  .modal-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.75);
    backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    z-index: 9999;
    animation: fadeUp 0.2s ease both;
  }
  .modal-box {
    background: var(--surface);
    border-radius: 24px;
    padding: 44px 52px;
    text-align: center;
    max-width: 380px;
    width: 90%;
  }

  .trow { border-bottom: 1px solid var(--border); transition: background 0.15s; }
  .trow:hover { background: rgba(255,255,255,0.025); }
  .trow:last-child { border-bottom: none; }

  .live-dot  { width:7px; height:7px; border-radius:50%; background:var(--safe); animation:blink 1.8s ease infinite; }
  .mock-dot  { width:7px; height:7px; border-radius:50%; background:var(--warn); animation:blink 1.8s ease infinite; }

  .scan-line {
    position: absolute; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent, rgba(99,102,241,0.5), transparent);
    animation: scan 3s ease-in-out infinite;
    pointer-events: none;
  }
`;

/* ── Modal ── */
function ResultModal({ show, fraud, probability, onClose }) {
  if (!show) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box"
        style={{
          border: `1px solid ${fraud ? "rgba(239,68,68,0.4)" : "rgba(16,185,129,0.3)"}`,
          boxShadow: fraud ? "0 0 60px rgba(239,68,68,0.2)" : "0 0 60px rgba(16,185,129,0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: 56, marginBottom: 16 }}>{fraud ? "🚨" : "🛡️"}</div>
        <h2 style={{ fontFamily: "'Space Mono',monospace", fontSize: 18, fontWeight: 700, color: fraud ? "#ef4444" : "#10b981", marginBottom: 10 }}>
          {fraud ? "FRAUD DETECTED" : "TRANSACTION SAFE"}
        </h2>
        <p style={{ color: "#64748b", fontSize: 13, marginBottom: 6 }}>Risk probability</p>
        <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 40, fontWeight: 700, color: fraud ? "#ef4444" : "#10b981", marginBottom: 28 }}>
          {probability}%
        </p>
        <button
          onClick={onClose}
          style={{
            background: fraud ? "linear-gradient(135deg,#dc2626,#ef4444)" : "linear-gradient(135deg,#059669,#10b981)",
            color: "#fff", border: "none", borderRadius: 12,
            padding: "12px 40px", fontFamily: "'DM Sans',sans-serif",
            fontSize: 14, fontWeight: 700, cursor: "pointer",
            boxShadow: fraud ? "0 4px 20px rgba(239,68,68,0.4)" : "0 4px 20px rgba(16,185,129,0.35)",
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

/* ── Mock helpers ── */
function mockPredict(amount) {
  const base = amount > 5000 ? 0.35 : 0;
  const risk = Math.min(1, Math.max(0, base + Math.random() * 0.6));
  return { risk_score: parseFloat(risk.toFixed(4)), fraud: risk > FRAUD_THRESHOLD };
}
function generateMockHistory(n = 14) {
  return Array.from({ length: n }, () => ({
    amount: (Math.random() * 9000 + 50).toFixed(2),
    time: Math.floor(Math.random() * 86400),
    risk_score: parseFloat(Math.min(1, Math.max(0, Math.random())).toFixed(4)),
  }));
}

/* ── Stat Card ── */
function StatCard({ icon, label, value, accent, delay }) {
  return (
    <div className={`stat-card fade-up-${delay}`} style={{ borderTop: `2px solid ${accent}` }}>
      <div style={{
        width: 46, height: 46, borderRadius: 12, flexShrink: 0,
        background: `${accent}1a`, display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 20,
      }}>{icon}</div>
      <div>
        <p style={{ color: "#64748b", fontSize: 11, fontWeight: 600, letterSpacing: "0.6px", textTransform: "uppercase", marginBottom: 4 }}>{label}</p>
        <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 26, fontWeight: 700, color: "#f1f5f9" }}>{value}</p>
      </div>
    </div>
  );
}

/* ── Main App ── */
export default function App() {
  const styleRef = useRef(null);
  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
    styleRef.current = el;
    return () => { if (styleRef.current) document.head.removeChild(styleRef.current); };
  }, []);

  const [amount, setAmount] = useState("");
  const [time, setTime]     = useState("");
  const [result, setResult] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(false);
  const [loadingHist, setLoadingHist]   = useState(false);
  const [modal, setModal]   = useState({ show: false, fraud: false, probability: 0 });
  const [mode, setMode]     = useState("unknown");
  const [error, setError]   = useState("");

  const total      = transactions.length;
  const fraudCount = transactions.filter((t) => t.risk_score > FRAUD_THRESHOLD).length;
  const safeCount  = total - fraudCount;
  const fraudRate  = total > 0 ? ((fraudCount / total) * 100).toFixed(1) : "0.0";

  const checkFraud = async () => {
    setError("");
    if (!amount || isNaN(+amount) || +amount <= 0) { setError("Enter a valid amount greater than 0"); return; }
    if (time === "" || isNaN(+time) || +time < 0)  { setError("Enter a valid time (seconds ≥ 0)");    return; }
    setLoading(true);
    let data;
    try {
      const res = await fetch(`${BACKEND_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: +amount, time: +time }),
      });
      if (!res.ok) throw new Error();
      data = await res.json();
      setMode("live");
    } catch {
      data = mockPredict(+amount);
      setMode("mock");
    }
    const probability = (data.risk_score * 100).toFixed(2);
    setResult({ probability, fraud: data.fraud });
    setModal({ show: true, fraud: data.fraud, probability });
    setTransactions((prev) => [
      { amount: (+amount).toFixed(2), time: +time, risk_score: data.risk_score },
      ...prev,
    ]);
    setLoading(false);
  };

  const loadHistory = async () => {
    setLoadingHist(true);
    let data;
    try {
      const res = await fetch(`${BACKEND_URL}/transactions`);
      if (!res.ok) throw new Error();
      data = await res.json();
      setMode("live");
    } catch {
      data = generateMockHistory();
      setMode("mock");
    }
    setTransactions(data);
    setLoadingHist(false);
  };

  const chartData = {
    labels: transactions.map((_, i) => `T${i + 1}`),
    datasets: [{
      label: "Risk Score",
      data: transactions.map((t) => +(t.risk_score * 100).toFixed(2)),
      backgroundColor: transactions.map((t) =>
        t.risk_score > FRAUD_THRESHOLD ? "rgba(239,68,68,0.75)" : "rgba(99,102,241,0.75)"
      ),
      borderColor: transactions.map((t) =>
        t.risk_score > FRAUD_THRESHOLD ? "#ef4444" : "#6366f1"
      ),
      borderWidth: 1, borderRadius: 6, barThickness: 20,
    }],
  };
  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#0d1424", titleColor: "#f1f5f9",
        bodyColor: "#94a3b8", padding: 14, cornerRadius: 10,
        callbacks: { label: (c) => ` Risk: ${c.raw}%` },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#475569", font: { size: 11 } } },
      y: {
        grid: { color: "rgba(255,255,255,0.04)" },
        ticks: { color: "#475569", font: { size: 11 }, callback: (v) => `${v}%` },
        beginAtZero: true, max: 100,
      },
    },
  };

  return (
    <div style={{ minHeight: "100vh", padding: "32px 24px 60px", maxWidth: 1280, margin: "0 auto" }}>
      <ResultModal
        show={modal.show} fraud={modal.fraud} probability={modal.probability}
        onClose={() => setModal((m) => ({ ...m, show: false }))}
      />

      {/* Header */}
      <header className="fade-up" style={{ marginBottom: 36, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: "linear-gradient(135deg,#6366f1,#3b82f6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, boxShadow: "0 4px 20px rgba(99,102,241,0.4)",
            }}>🛡️</div>
            <h1 style={{ fontFamily: "'Space Mono',monospace", fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px", color: "#f1f5f9" }}>
              Fraud<span style={{ color: "#6366f1" }}>Guard</span>
            </h1>
          </div>
          <p style={{ color: "#64748b", fontSize: 13 }}>Real-time transaction risk intelligence</p>
        </div>
        {mode !== "unknown" && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 16px", borderRadius: 10,
            background: "#0d1424", border: "1px solid rgba(255,255,255,0.13)",
            fontSize: 12, color: "#94a3b8", fontWeight: 500,
          }}>
            <div className={mode === "live" ? "live-dot" : "mock-dot"} />
            {mode === "live" ? "Live Backend" : "Demo Mode"}
          </div>
        )}
      </header>

      {/* Input Panel */}
      <div className="panel fade-up-1" style={{ maxWidth: 680, marginBottom: 28 }}>
        <h2 style={{ fontSize: 12, fontWeight: 700, color: "#64748b", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 20 }}>
          Analyze Transaction
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#64748b", marginBottom: 7, fontWeight: 500 }}>Amount ($)</label>
            <input
              className="input-field" type="number" min="0"
              placeholder="e.g. 2500.00"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && checkFraud()}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#64748b", marginBottom: 7, fontWeight: 500 }}>Time (seconds)</label>
            <input
              className="input-field" type="number" min="0"
              placeholder="e.g. 3600"
              value={time}
              onChange={(e) => { setTime(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && checkFraud()}
            />
          </div>
        </div>
        {error && (
          <p style={{ color: "#f87171", fontSize: 12, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
            ⚠ {error}
          </p>
        )}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <button className="btn-primary" onClick={checkFraud} disabled={loading}>
            {loading ? "⏳ Analyzing…" : "🔍 Analyze Transaction"}
          </button>
          <button className="btn-secondary" onClick={loadHistory} disabled={loadingHist}>
            {loadingHist ? "⏳ Loading…" : "📥 Load History"}
          </button>
          {transactions.length > 0 && (
            <button className="btn-ghost" onClick={() => { setTransactions([]); setResult(null); }}>
              🗑 Clear
            </button>
          )}
        </div>

        {result && (
          <div style={{
            marginTop: 20, padding: "18px 22px",
            borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "space-between",
            background: result.fraud ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.07)",
            border: `1px solid ${result.fraud ? "rgba(239,68,68,0.25)" : "rgba(16,185,129,0.2)"}`,
            gap: 16, flexWrap: "wrap",
          }}>
            <div>
              <p style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 4 }}>Fraud Probability</p>
              <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 30, fontWeight: 700, color: result.fraud ? "#ef4444" : "#10b981" }}>
                {result.probability}%
              </p>
            </div>
            <span className={`badge ${result.fraud ? "badge-fraud" : "badge-safe"}`} style={{ fontSize: 13, padding: "8px 18px" }}>
              {result.fraud ? "⚠ High Risk" : "✓ Safe"}
            </span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 16, marginBottom: 28 }}>
        <StatCard icon="📊" label="Total Transactions" value={total}           accent="#3b82f6" delay="2" />
        <StatCard icon="🚨" label="Fraud Cases"        value={fraudCount}      accent="#ef4444" delay="3" />
        <StatCard icon="✅" label="Safe Transactions"  value={safeCount}       accent="#10b981" delay="4" />
        <StatCard icon="📈" label="Fraud Rate"         value={`${fraudRate}%`} accent="#f59e0b" delay="5" />
      </div>

      {/* Chart + Table */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(400px,1fr))", gap: 24 }}>

        {/* Chart */}
        <div className="panel fade-up-3">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>
              Risk Score Distribution
            </h3>
            <div style={{ display: "flex", gap: 14 }}>
              {[["#6366f1","Safe"],["#ef4444","Fraud"]].map(([c,l]) => (
                <span key={l} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:"#64748b" }}>
                  <span style={{ width:8, height:8, borderRadius:2, background:c, display:"inline-block" }} />{l}
                </span>
              ))}
            </div>
          </div>
          <div style={{ height: 270, position: "relative" }}>
            {transactions.length > 0 ? (
              <Bar data={chartData} options={chartOptions} />
            ) : (
              <div style={{
                height: "100%", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                border: "1px dashed rgba(255,255,255,0.13)", borderRadius: 14,
                gap: 10, position: "relative", overflow: "hidden",
              }}>
                <div className="scan-line" />
                <span style={{ fontSize: 32 }}>📉</span>
                <p style={{ color: "#64748b", fontSize: 13 }}>Analyze a transaction to populate chart</p>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="panel fade-up-4">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>
              Recent Transactions
            </h3>
            {transactions.length > 0 && (
              <span style={{ fontSize: 11, color: "#64748b", fontFamily: "'Space Mono',monospace" }}>
                {Math.min(transactions.length, 10)} / {transactions.length}
              </span>
            )}
          </div>

          {transactions.length === 0 ? (
            <div style={{
              height: 270, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              border: "1px dashed rgba(255,255,255,0.13)", borderRadius: 14, gap: 10,
            }}>
              <span style={{ fontSize: 32 }}>📋</span>
              <p style={{ color: "#64748b", fontSize: 13 }}>No transactions yet</p>
            </div>
          ) : (
            <div style={{ maxHeight: 300, overflowY: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.13)" }}>
                    {["#","Amount","Time","Risk","Status"].map((h) => (
                      <th key={h} style={{
                        padding: "10px 10px", textAlign: "left", color: "#64748b",
                        fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px",
                        position: "sticky", top: 0, background: "#0d1424",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 10).map((t, i) => {
                    const riskPct = (t.risk_score * 100).toFixed(1);
                    const isFraud = t.risk_score > FRAUD_THRESHOLD;
                    return (
                      <tr key={i} className="trow">
                        <td style={{ padding:"11px 10px", color:"#64748b", fontFamily:"'Space Mono',monospace", fontSize:11 }}>{i + 1}</td>
                        <td style={{ padding:"11px 10px", fontFamily:"'Space Mono',monospace", fontWeight:700 }}>
                          ${parseFloat(t.amount).toLocaleString()}
                        </td>
                        <td style={{ padding:"11px 10px", color:"#94a3b8", fontFamily:"'Space Mono',monospace", fontSize:12 }}>
                          {t.time}s
                        </td>
                        <td style={{ padding:"11px 10px" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <div className="risk-bar-track">
                              <div className="risk-bar-fill" style={{
                                width: `${riskPct}%`,
                                background: isFraud
                                  ? "linear-gradient(90deg,#ef4444,#f87171)"
                                  : "linear-gradient(90deg,#10b981,#34d399)",
                              }} />
                            </div>
                            <span style={{ fontFamily:"'Space Mono',monospace", fontSize:11, color:"#94a3b8", minWidth:36 }}>
                              {riskPct}%
                            </span>
                          </div>
                        </td>
                        <td style={{ padding:"11px 10px" }}>
                          <span className={`badge ${isFraud ? "badge-fraud" : "badge-safe"}`}>
                            {isFraud ? "Fraud" : "Safe"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <p style={{ textAlign:"center", marginTop:48, color:"#334155", fontSize:12, fontFamily:"'Space Mono',monospace" }}>
        FraudGuard · Threshold {(FRAUD_THRESHOLD * 100).toFixed(0)}% · {new Date().getFullYear()}
      </p>
    </div>
  );
}