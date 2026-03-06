import { useState } from "react";
import Head from "next/head";

const TONES = [
  { id: "friendly", label: "😊 Friendly", desc: "Warm & approachable" },
  { id: "professional", label: "💼 Professional", desc: "Formal & polished" },
  { id: "apologetic", label: "🙏 Apologetic", desc: "Empathetic & sorry" },
  { id: "concise", label: "⚡ Quick", desc: "Short & direct" },
];

export default function Home() {
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState("friendly");
  const [businessType, setBusinessType] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [charCount, setCharCount] = useState(0);

  async function handleSubmit() {
    if (!message.trim()) return;
    setLoading(true);
    setError("");
    setReply("");
    setCopied(false);

    try {
      const res = await fetch("/api/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, tone, businessType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setReply(data.reply);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(reply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleMessageChange(e) {
    setMessage(e.target.value);
    setCharCount(e.target.value.length);
  }

  return (
    <>
      <Head>
        <title>SimpleAI — Reply to customers in seconds</title>
        <meta name="description" content="Paste a customer email or review. Get a professional reply instantly. No tech skills needed." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=Source+Sans+3:wght@300;400;500&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #FAFAF7;
          --surface: #FFFFFF;
          --ink: #1C1917;
          --muted: rgba(28,25,23,0.5);
          --border: rgba(28,25,23,0.1);
          --amber: #C96A1A;
          --amber-bg: rgba(201,106,26,0.08);
          --amber-border: rgba(201,106,26,0.25);
          --green: #2D6A4F;
          --green-bg: rgba(45,106,79,0.08);
          --radius: 8px;
          --shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04);
        }

        html, body {
          font-family: 'Source Sans 3', sans-serif;
          background: var(--bg);
          color: var(--ink);
          min-height: 100vh;
          font-size: 16px;
          -webkit-font-smoothing: antialiased;
        }

        .page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        /* HEADER */
        header {
          padding: 1.25rem 2rem;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--surface);
        }

        .logo {
          font-family: 'Lora', serif;
          font-size: 1.3rem;
          color: var(--ink);
          letter-spacing: -0.01em;
        }

        .logo span { color: var(--amber); }

        .header-tag {
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--muted);
          letter-spacing: 0.04em;
          background: var(--amber-bg);
          border: 1px solid var(--amber-border);
          color: var(--amber);
          padding: 0.25rem 0.7rem;
          border-radius: 100px;
        }

        /* MAIN */
        main {
          flex: 1;
          max-width: 680px;
          width: 100%;
          margin: 0 auto;
          padding: 3rem 1.5rem 4rem;
        }

        .headline {
          font-family: 'Lora', serif;
          font-size: clamp(1.8rem, 4vw, 2.4rem);
          line-height: 1.2;
          letter-spacing: -0.02em;
          margin-bottom: 0.75rem;
          color: var(--ink);
        }

        .headline em { font-style: italic; color: var(--amber); }

        .subhead {
          font-size: 1.05rem;
          color: var(--muted);
          font-weight: 300;
          line-height: 1.6;
          margin-bottom: 2.5rem;
        }

        /* CARD */
        .card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          overflow: hidden;
        }

        .card-section {
          padding: 1.5rem;
          border-bottom: 1px solid var(--border);
        }

        .card-section:last-child { border-bottom: none; }

        .section-label {
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        /* OPTIONAL BIZ INPUT */
        .biz-input {
          width: 100%;
          padding: 0.65rem 0.9rem;
          border: 1.5px solid var(--border);
          border-radius: 6px;
          font-family: 'Source Sans 3', sans-serif;
          font-size: 0.95rem;
          background: var(--bg);
          color: var(--ink);
          outline: none;
          transition: border-color 0.15s;
        }

        .biz-input:focus { border-color: var(--amber); background: #fff; }
        .biz-input::placeholder { color: rgba(28,25,23,0.3); }

        /* TONE SELECTOR */
        .tone-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.5rem;
        }

        .tone-btn {
          padding: 0.65rem 0.5rem;
          border: 1.5px solid var(--border);
          border-radius: 6px;
          background: var(--bg);
          cursor: pointer;
          text-align: center;
          transition: all 0.15s;
          font-family: 'Source Sans 3', sans-serif;
        }

        .tone-btn:hover { border-color: var(--amber); background: var(--amber-bg); }

        .tone-btn.active {
          border-color: var(--amber);
          background: var(--amber-bg);
        }

        .tone-emoji { font-size: 1.1rem; display: block; margin-bottom: 0.2rem; }
        .tone-name { font-size: 0.8rem; font-weight: 500; color: var(--ink); display: block; }
        .tone-desc { font-size: 0.7rem; color: var(--muted); display: block; margin-top: 0.1rem; }

        /* MESSAGE TEXTAREA */
        .message-wrap { position: relative; }

        textarea {
          width: 100%;
          min-height: 140px;
          padding: 0.9rem;
          border: 1.5px solid var(--border);
          border-radius: 6px;
          font-family: 'Source Sans 3', sans-serif;
          font-size: 0.97rem;
          line-height: 1.6;
          background: var(--bg);
          color: var(--ink);
          resize: vertical;
          outline: none;
          transition: border-color 0.15s;
        }

        textarea:focus { border-color: var(--amber); background: #fff; }
        textarea::placeholder { color: rgba(28,25,23,0.3); }

        .char-count {
          position: absolute;
          bottom: 0.5rem;
          right: 0.75rem;
          font-size: 0.72rem;
          color: var(--muted);
        }

        /* SUBMIT BUTTON */
        .submit-btn {
          width: 100%;
          padding: 1rem;
          background: var(--ink);
          color: #fff;
          border: none;
          border-radius: 6px;
          font-family: 'Source Sans 3', sans-serif;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .submit-btn:hover:not(:disabled) { background: var(--amber); }
        .submit-btn:active:not(:disabled) { transform: scale(0.99); }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        /* ERROR */
        .error-box {
          margin-top: 1rem;
          padding: 0.9rem 1rem;
          background: rgba(185,28,28,0.06);
          border: 1px solid rgba(185,28,28,0.2);
          border-radius: 6px;
          color: #991b1b;
          font-size: 0.9rem;
          line-height: 1.5;
        }

        /* REPLY OUTPUT */
        .reply-section {
          margin-top: 1.5rem;
          animation: fadeUp 0.35s ease both;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .reply-label {
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--green);
          margin-bottom: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .reply-label::before {
          content: '✓';
          background: var(--green-bg);
          color: var(--green);
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.65rem;
          font-weight: 700;
        }

        .reply-box {
          background: var(--green-bg);
          border: 1px solid rgba(45,106,79,0.2);
          border-radius: 6px;
          padding: 1.2rem;
          font-size: 0.97rem;
          line-height: 1.7;
          color: var(--ink);
          white-space: pre-wrap;
          font-family: 'Source Sans 3', sans-serif;
          margin-bottom: 0.75rem;
        }

        .copy-btn {
          padding: 0.6rem 1.2rem;
          background: var(--ink);
          color: #fff;
          border: none;
          border-radius: 6px;
          font-family: 'Source Sans 3', sans-serif;
          font-size: 0.88rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
        }

        .copy-btn:hover { background: var(--green); }
        .copy-btn.copied { background: var(--green); }

        .try-again {
          margin-left: 0.75rem;
          background: none;
          border: 1.5px solid var(--border);
          color: var(--muted);
          padding: 0.6rem 1.2rem;
          border-radius: 6px;
          font-family: 'Source Sans 3', sans-serif;
          font-size: 0.88rem;
          cursor: pointer;
          transition: border-color 0.15s, color 0.15s;
        }

        .try-again:hover { border-color: var(--ink); color: var(--ink); }

        /* FOOTER */
        footer {
          border-top: 1px solid var(--border);
          padding: 1.25rem 2rem;
          text-align: center;
          font-size: 0.78rem;
          color: var(--muted);
        }

        footer a { color: var(--amber); text-decoration: none; }

        @media (max-width: 480px) {
          .tone-grid { grid-template-columns: repeat(2, 1fr); }
          header { padding: 1rem 1.25rem; }
        }
      `}</style>

      <div className="page">
        <header>
          <div className="logo">Simple<span>AI</span></div>
          <span className="header-tag">Free · No signup</span>
        </header>

        <main>
          <h1 className="headline">Reply to customers<br /><em>in 10 seconds.</em></h1>
          <p className="subhead">Paste any customer email, review, or message. Pick a tone. Get a professional reply — no tech skills needed.</p>

          <div className="card">

            {/* Optional business type */}
            <div className="card-section">
              <div className="section-label">Your business type <span style={{fontWeight:300, textTransform:'none', letterSpacing:0}}>(optional)</span></div>
              <input
                className="biz-input"
                type="text"
                placeholder="e.g. cleaning company, café, hair salon, plumber..."
                value={businessType}
                onChange={e => setBusinessType(e.target.value)}
                maxLength={60}
              />
            </div>

            {/* Tone selector */}
            <div className="card-section">
              <div className="section-label">Reply tone</div>
              <div className="tone-grid">
                {TONES.map(t => (
                  <button
                    key={t.id}
                    className={`tone-btn ${tone === t.id ? "active" : ""}`}
                    onClick={() => setTone(t.id)}
                  >
                    <span className="tone-emoji">{t.label.split(" ")[0]}</span>
                    <span className="tone-name">{t.label.split(" ").slice(1).join(" ")}</span>
                    <span className="tone-desc">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Message input */}
            <div className="card-section">
              <div className="section-label">Customer message</div>
              <div className="message-wrap">
                <textarea
                  placeholder="Paste the customer's email, review, or message here..."
                  value={message}
                  onChange={handleMessageChange}
                  maxLength={1000}
                />
                <span className="char-count">{charCount}/1000</span>
              </div>
            </div>

            {/* Submit */}
            <div className="card-section">
              <button
                className="submit-btn"
                onClick={handleSubmit}
                disabled={loading || !message.trim()}
              >
                {loading ? (
                  <><div className="spinner" /> Writing your reply…</>
                ) : (
                  "✍️ Write my reply"
                )}
              </button>

              {error && <div className="error-box">⚠️ {error}</div>}
            </div>
          </div>

          {/* Reply output */}
          {reply && (
            <div className="reply-section">
              <div className="reply-label">Your reply is ready</div>
              <div className="reply-box">{reply}</div>
              <button className={`copy-btn ${copied ? "copied" : ""}`} onClick={handleCopy}>
                {copied ? "✓ Copied!" : "Copy reply"}
              </button>
              <button className="try-again" onClick={() => { setReply(""); setMessage(""); setCharCount(0); }}>
                Start over
              </button>
            </div>
          )}
        </main>

        <footer>
          Powered by <a href="https://anthropic.com" target="_blank" rel="noopener">Claude AI</a> · Built by <a href="/" target="_blank">SimpleAI</a> · 10 free replies/day
        </footer>
      </div>
    </>
  );
}
