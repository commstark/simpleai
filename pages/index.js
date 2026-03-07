import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { track } from "@vercel/analytics";

const GOALS = [
  { id: "retain",    label: "🎯 Win them back",  desc: "Keep the customer" },
  { id: "apologize", label: "🙏 Own the mistake", desc: "Take accountability" },
  { id: "resolve",   label: "⚡ Resolve it fast", desc: "Fix the issue" },
  { id: "thanks",    label: "✨ Say thanks",       desc: "Positive review" },
];

const CHANGELOG = [
  {
    title: "Personalised greetings",
    feedback: "\"Dear Customer\" felt cold — testers said a first name would make replies actually usable.",
    fix: "Added a customer name field. Replies now open with 'Hi Sarah,' instead of 'Dear Customer.'",
  },
  {
    title: "Goal-first reply framing",
    feedback: "\"I want to pick the goal, not just the tone. Goals matter. Tone is fluff.\"",
    fix: "Replaced the tone selector with four goal-driven options: Win them back, Own the mistake, Resolve it fast, Say thanks.",
  },
  {
    title: "Positive review replies",
    feedback: "\"Can it also help me reply to good reviews? I'd use this all the time if it did that.\"",
    fix: "The new 'Say thanks' goal generates warm, genuine replies to positive reviews and compliments.",
  },
];

export default function Home() {
  const [message, setMessage] = useState("");
  const [goal, setGoal] = useState("retain");
  const [businessType, setBusinessType] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [feedbackRating, setFeedbackRating] = useState(null);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackState, setFeedbackState] = useState("idle");
  const [referralCode, setReferralCode] = useState("");
  const [referralCount, setReferralCount] = useState(0);
  const [referralCopied, setReferralCopied] = useState(false);
  const trackedRef = useRef(false);

  // Init referral code from localStorage, track incoming ?ref=
  useEffect(() => {
    let code = localStorage.getItem("simpleai_ref_code");
    if (!code) {
      code = Math.random().toString(36).slice(2, 10).toUpperCase();
      localStorage.setItem("simpleai_ref_code", code);
    }
    setReferralCode(code);

    fetch(`/api/referral?code=${code}`)
      .then(r => r.json())
      .then(d => setReferralCount(d.count || 0))
      .catch(() => {});

    // Track if arriving via someone else's referral link
    const params = new URLSearchParams(window.location.search);
    const incomingRef = params.get("ref");
    if (incomingRef && incomingRef !== code && !trackedRef.current) {
      trackedRef.current = true;
      fetch("/api/referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referrerCode: incomingRef }),
      }).catch(() => {});
    }
  }, []);

  function handleReferralCopy() {
    const link = `https://simpleai-nine.vercel.app?ref=${referralCode}`;
    navigator.clipboard.writeText(link).then(() => {
      setReferralCopied(true);
      setTimeout(() => setReferralCopied(false), 2000);
    });
  }

  async function handleSubmit() {
    if (!message.trim()) return;
    setLoading(true);
    setError("");
    setReply("");
    setCopied(false);
    setFeedbackRating(null);
    setFeedbackComment("");
    setFeedbackState("idle");

    track("query_submitted", { goal, has_business_type: !!businessType, has_customer_name: !!customerName });

    try {
      const res = await fetch("/api/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, goal, customerName, businessType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setReply(data.reply);
      track("reply_received", { goal });
    } catch (e) {
      setError(e.message);
      track("reply_error", { error: e.message });
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

  function handleFeedback(rating) {
    setFeedbackRating(rating);
    setFeedbackState("open");
  }

  async function submitFeedback() {
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: feedbackRating, comment: feedbackComment, goal }),
      });
    } catch (_) {}
    setFeedbackState("submitted");
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

        .page { min-height: 100vh; display: flex; flex-direction: column; }

        header {
          padding: 1.25rem 2rem;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--surface);
        }

        .logo { font-family: 'Lora', serif; font-size: 1.3rem; color: var(--ink); letter-spacing: -0.01em; }
        .logo span { color: var(--amber); }

        .header-tag {
          font-size: 0.75rem;
          font-weight: 500;
          letter-spacing: 0.04em;
          background: var(--amber-bg);
          border: 1px solid var(--amber-border);
          color: var(--amber);
          padding: 0.25rem 0.7rem;
          border-radius: 100px;
        }

        main { flex: 1; max-width: 680px; width: 100%; margin: 0 auto; padding: 3rem 1.5rem 4rem; }

        .headline {
          font-family: 'Lora', serif;
          font-size: clamp(1.8rem, 4vw, 2.4rem);
          line-height: 1.2;
          letter-spacing: -0.02em;
          margin-bottom: 0.75rem;
        }
        .headline em { font-style: italic; color: var(--amber); }
        .subhead { font-size: 1.05rem; color: var(--muted); font-weight: 300; line-height: 1.6; margin-bottom: 2.5rem; }

        .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow); overflow: hidden; }
        .card-section { padding: 1.5rem; border-bottom: 1px solid var(--border); }
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

        .row-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }

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

        .goal-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; }

        .goal-btn {
          padding: 0.65rem 0.5rem;
          border: 1.5px solid var(--border);
          border-radius: 6px;
          background: var(--bg);
          cursor: pointer;
          text-align: center;
          transition: all 0.15s;
          font-family: 'Source Sans 3', sans-serif;
        }
        .goal-btn:hover { border-color: var(--amber); background: var(--amber-bg); }
        .goal-btn.active { border-color: var(--amber); background: var(--amber-bg); }
        .goal-emoji { font-size: 1.1rem; display: block; margin-bottom: 0.2rem; }
        .goal-name { font-size: 0.8rem; font-weight: 500; color: var(--ink); display: block; }
        .goal-desc { font-size: 0.7rem; color: var(--muted); display: block; margin-top: 0.1rem; }

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
        .char-count { position: absolute; bottom: 0.5rem; right: 0.75rem; font-size: 0.72rem; color: var(--muted); }

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

        .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

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

        .reply-section { margin-top: 1.5rem; animation: fadeUp 0.35s ease both; }

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
          width: 18px; height: 18px;
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

        .reply-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }

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

        .regenerate {
          background: none;
          border: 1.5px solid var(--amber-border);
          color: var(--amber);
          padding: 0.6rem 1.2rem;
          border-radius: 6px;
          font-family: 'Source Sans 3', sans-serif;
          font-size: 0.88rem;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
        }
        .regenerate:hover { background: var(--amber-bg); }

        /* FEEDBACK */
        .feedback-widget { margin-top: 1.25rem; padding-top: 1.25rem; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 0.6rem; }
        .feedback-question { font-size: 0.85rem; color: var(--muted); }
        .feedback-thumbs { display: flex; gap: 0.5rem; }
        .thumb-btn { font-size: 1.2rem; background: none; border: 1.5px solid var(--border); border-radius: 6px; padding: 0.35rem 0.65rem; cursor: pointer; transition: all 0.15s; line-height: 1; }
        .thumb-btn:hover { border-color: var(--amber); background: var(--amber-bg); }
        .thumb-active-up { border-color: var(--green) !important; background: var(--green-bg) !important; }
        .thumb-active-down { border-color: #991b1b !important; background: rgba(185,28,28,0.06) !important; }
        .feedback-comment { display: flex; flex-direction: column; gap: 0.5rem; animation: fadeUp 0.2s ease both; }
        .feedback-textarea { min-height: auto !important; height: 60px !important; font-size: 0.88rem !important; padding: 0.6rem 0.8rem !important; resize: none !important; }
        .feedback-submit-btn { align-self: flex-start; padding: 0.45rem 1rem; background: var(--ink); color: #fff; border: none; border-radius: 6px; font-family: 'Source Sans 3', sans-serif; font-size: 0.83rem; font-weight: 500; cursor: pointer; transition: background 0.15s; }
        .feedback-submit-btn:hover { background: var(--amber); }
        .feedback-thanks { font-size: 0.88rem; color: var(--green); font-weight: 500; }

        /* CHANGELOG */
        .changelog {
          margin-top: 3rem;
          padding-top: 2.5rem;
          border-top: 1px solid var(--border);
        }

        .changelog-eyebrow {
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--amber);
          margin-bottom: 0.5rem;
        }

        .changelog-title {
          font-family: 'Lora', serif;
          font-size: 1.35rem;
          letter-spacing: -0.01em;
          margin-bottom: 0.4rem;
        }

        .changelog-subtitle {
          font-size: 0.88rem;
          color: var(--muted);
          margin-bottom: 1.5rem;
        }

        .changelog-list { display: flex; flex-direction: column; gap: 0.75rem; }

        .changelog-item {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 1.1rem 1.25rem;
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 0.75rem 1rem;
          align-items: start;
        }

        .changelog-num {
          font-family: 'Lora', serif;
          font-size: 1.1rem;
          color: var(--amber);
          line-height: 1.4;
        }

        .changelog-item-title {
          font-size: 0.92rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .changelog-quote {
          font-size: 0.82rem;
          color: var(--muted);
          font-style: italic;
          margin-bottom: 0.3rem;
          padding-left: 0.6rem;
          border-left: 2px solid var(--amber-border);
        }

        .changelog-fix {
          font-size: 0.84rem;
          color: var(--green);
          font-weight: 500;
        }

        /* REFERRAL */
        .referral-section {
          margin-top: 3rem;
          padding: 1.5rem;
          background: var(--surface);
          border: 1.5px solid var(--amber-border);
          border-radius: var(--radius);
          box-shadow: var(--shadow);
        }
        .referral-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap; }
        .referral-eyebrow { font-size: 0.68rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--amber); margin-bottom: 0.25rem; }
        .referral-title { font-family: 'Lora', serif; font-size: 1.1rem; font-weight: 600; color: var(--ink); margin-bottom: 0.2rem; }
        .referral-sub { font-size: 0.85rem; color: var(--muted); }
        .referral-count-box { text-align: center; background: var(--amber-bg); border: 1px solid var(--amber-border); border-radius: 8px; padding: 0.75rem 1.25rem; flex-shrink: 0; }
        .referral-count-num { font-family: 'Lora', serif; font-size: 2rem; color: var(--amber); display: block; line-height: 1; }
        .referral-count-label { font-size: 0.72rem; color: var(--amber); font-weight: 500; }
        .referral-link-row { display: flex; gap: 0.5rem; align-items: center; }
        .referral-link-display {
          flex: 1;
          padding: 0.6rem 0.9rem;
          background: var(--bg);
          border: 1.5px solid var(--border);
          border-radius: 6px;
          font-size: 0.83rem;
          color: var(--muted);
          font-family: monospace;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .referral-copy-btn {
          padding: 0.6rem 1.1rem;
          background: var(--amber);
          color: #fff;
          border: none;
          border-radius: 6px;
          font-family: 'Source Sans 3', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .referral-copy-btn:hover { background: #a85515; }
        .referral-copy-btn.copied { background: var(--green); }

        footer { border-top: 1px solid var(--border); padding: 1.25rem 2rem; text-align: center; font-size: 0.78rem; color: var(--muted); margin-top: 2rem; }
        footer a { color: var(--amber); text-decoration: none; }

        @media (max-width: 520px) {
          .goal-grid { grid-template-columns: repeat(2, 1fr); }
          .row-inputs { grid-template-columns: 1fr; }
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
          <p className="subhead">Paste any customer email, review, or message. Pick your goal. Get a reply — no tech skills needed.</p>

          <div className="card">

            {/* Business type + customer name */}
            <div className="card-section">
              <div className="section-label">About this message</div>
              <div className="row-inputs">
                <input
                  className="biz-input"
                  type="text"
                  placeholder="Your business (e.g. yoga studio, café)"
                  value={businessType}
                  onChange={e => setBusinessType(e.target.value)}
                  maxLength={60}
                />
                <input
                  className="biz-input"
                  type="text"
                  placeholder="Customer first name (e.g. Sarah)"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  maxLength={40}
                />
              </div>
            </div>

            {/* Goal selector */}
            <div className="card-section">
              <div className="section-label">What should this reply do?</div>
              <div className="goal-grid">
                {GOALS.map(g => (
                  <button
                    key={g.id}
                    className={`goal-btn ${goal === g.id ? "active" : ""}`}
                    onClick={() => setGoal(g.id)}
                  >
                    <span className="goal-emoji">{g.label.split(" ")[0]}</span>
                    <span className="goal-name">{g.label.split(" ").slice(1).join(" ")}</span>
                    <span className="goal-desc">{g.desc}</span>
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
              <div className="reply-actions">
                <button className={`copy-btn ${copied ? "copied" : ""}`} onClick={handleCopy}>
                  {copied ? "✓ Copied!" : "Copy reply"}
                </button>
                <button className="regenerate" onClick={handleSubmit} disabled={loading}>
                  Try again
                </button>
                <button className="try-again" onClick={() => { setReply(""); setMessage(""); setCharCount(0); setCustomerName(""); setFeedbackRating(null); setFeedbackComment(""); setFeedbackState("idle"); }}>
                  Start over
                </button>
              </div>

              <div className="feedback-widget">
                {feedbackState !== "submitted" ? (
                  <>
                    <div className="feedback-question">Was this reply helpful?</div>
                    <div className="feedback-thumbs">
                      <button className={`thumb-btn ${feedbackRating === "up" ? "thumb-active-up" : ""}`} onClick={() => handleFeedback("up")}>👍</button>
                      <button className={`thumb-btn ${feedbackRating === "down" ? "thumb-active-down" : ""}`} onClick={() => handleFeedback("down")}>👎</button>
                    </div>
                    {feedbackState === "open" && (
                      <div className="feedback-comment">
                        <textarea className="feedback-textarea" placeholder="Any comments? (optional)" value={feedbackComment} onChange={e => setFeedbackComment(e.target.value)} />
                        <button className="feedback-submit-btn" onClick={submitFeedback}>Send feedback</button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="feedback-thanks">Thanks for your feedback 🙏</div>
                )}
              </div>
            </div>
          )}

          {/* Share & Invite */}
          {referralCode && (
            <div className="referral-section">
              <div className="referral-header">
                <div>
                  <div className="referral-eyebrow">Share & Invite</div>
                  <div className="referral-title">Know a small business owner?</div>
                  <p className="referral-sub">Send them your link — it's free and takes 30 seconds.</p>
                </div>
                <div className="referral-count-box">
                  <span className="referral-count-num">{referralCount}</span>
                  <span className="referral-count-label">people invited</span>
                </div>
              </div>
              <div className="referral-link-row">
                <div className="referral-link-display">
                  simpleai-nine.vercel.app?ref={referralCode}
                </div>
                <button className={`referral-copy-btn ${referralCopied ? "copied" : ""}`} onClick={handleReferralCopy}>
                  {referralCopied ? "✓ Copied!" : "Copy link"}
                </button>
              </div>
            </div>
          )}

          {/* What's New changelog */}
          <div className="changelog">
            <div className="changelog-eyebrow">What's new · March 2026</div>
            <div className="changelog-title">Built from your feedback</div>
            <p className="changelog-subtitle">We ran user tests with 5 small business owners. Here's what changed.</p>
            <div className="changelog-list">
              {CHANGELOG.map((item, i) => (
                <div className="changelog-item" key={i}>
                  <span className="changelog-num">{i + 1}</span>
                  <div>
                    <div className="changelog-item-title">{item.title}</div>
                    <div className="changelog-quote">{item.feedback}</div>
                    <div className="changelog-fix">✓ {item.fix}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>

        <footer>
          Powered by <a href="https://anthropic.com" target="_blank" rel="noopener">Claude AI</a> · Built by SimpleAI
        </footer>
      </div>
    </>
  );
}
