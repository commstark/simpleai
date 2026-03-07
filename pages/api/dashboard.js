const BREVO_API = "https://api.brevo.com/v3";

function isoDate(d) {
  return d.toISOString().split("T")[0];
}

function periodDates(period) {
  const now = new Date();
  const days = period === "all" ? null : parseInt(period);
  const start = days ? new Date(now.getTime() - days * 86400000) : null;
  const prevStart = days ? new Date(now.getTime() - 2 * days * 86400000) : null;
  return { now, start, prevStart };
}

async function brevoFetch(path) {
  const res = await fetch(`${BREVO_API}${path}`, {
    headers: { "api-key": process.env.BREVO_API_KEY, accept: "application/json" },
  });
  if (!res.ok) return null;
  return res.json();
}

async function supabaseFetch(table, filters = "") {
  const url = `${process.env.SUPABASE_URL}/rest/v1/${table}?select=*${filters}`;
  const res = await fetch(url, {
    headers: {
      apikey: process.env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
    },
  });
  if (!res.ok) return [];
  return res.json();
}

async function getSignups(start, end) {
  let path = "/contacts?limit=1";
  if (start) path += `&createdSince=${isoDate(start)}`;
  if (end) path += `&createdUntil=${isoDate(end)}`;
  const data = await brevoFetch(path);
  return data?.count ?? 0;
}

async function getEmailStats(start, end) {
  const now = new Date();
  let path = `/smtp/statistics/aggregatedReport?startDate=${isoDate(start || new Date("2024-01-01"))}&endDate=${isoDate(end || now)}`;
  const data = await brevoFetch(path);
  return {
    sent: data?.requests ?? 0,
    delivered: data?.delivered ?? 0,
    opens: data?.views ?? 0,
    clicks: data?.clicks ?? 0,
  };
}

async function getFeedback(startIso) {
  const filter = startIso ? `&created_at=gte.${startIso}` : "";
  const rows = await supabaseFetch("feedback", filter);
  const up = rows.filter((r) => r.rating === "up").length;
  const down = rows.filter((r) => r.rating === "down").length;
  return { total: rows.length, up, down };
}

async function getUsage(startIso) {
  const filter = startIso ? `&created_at=gte.${startIso}` : "";
  const rows = await supabaseFetch("usage", filter);
  return { total: rows.length };
}

async function getReferrals(startIso) {
  const filter = startIso ? `&created_at=gte.${startIso}` : "";
  const rows = await supabaseFetch("referrals", filter);
  return { total: rows.length };
}

function trend(current, previous) {
  if (!previous) return "flat";
  if (current > previous) return "up";
  if (current < previous) return "down";
  return "flat";
}

function pct(a, b) {
  if (!b) return 0;
  return Math.round((a / b) * 100);
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const { period = "30" } = req.query;
  const { now, start, prevStart } = periodDates(period);

  try {
    const [
      signupsCur, signupsPrev,
      emailCur, emailPrev,
      feedbackCur, feedbackPrev,
      usageCur, usagePrev,
      referralsCur, referralsPrev,
    ] = await Promise.all([
      getSignups(start, null),
      start ? getSignups(prevStart, start) : Promise.resolve(0),
      getEmailStats(start, null),
      start ? getEmailStats(prevStart, start) : Promise.resolve({ sent: 0, delivered: 0, opens: 0, clicks: 0 }),
      getFeedback(start ? start.toISOString() : null),
      start ? getFeedback(prevStart.toISOString()) : Promise.resolve({ total: 0, up: 0, down: 0 }),
      getUsage(start ? start.toISOString() : null),
      start ? getUsage(prevStart.toISOString()) : Promise.resolve({ total: 0 }),
      getReferrals(start ? start.toISOString() : null),
      start ? getReferrals(prevStart.toISOString()) : Promise.resolve({ total: 0 }),
    ]);

    const metrics = [
      {
        id: "signups",
        label: "Email Signups",
        value: signupsCur,
        prev: signupsPrev,
        trend: trend(signupsCur, signupsPrev),
        format: "number",
        stage: 1,
      },
      {
        id: "sent",
        label: "Emails Sent",
        value: emailCur.sent,
        prev: emailPrev.sent,
        trend: trend(emailCur.sent, emailPrev.sent),
        format: "number",
        stage: 2,
      },
      {
        id: "opens",
        label: "Email Opens",
        value: emailCur.opens,
        prev: emailPrev.opens,
        trend: trend(emailCur.opens, emailPrev.opens),
        rate: pct(emailCur.opens, emailCur.sent),
        prevRate: pct(emailPrev.opens, emailPrev.sent),
        format: "number",
        stage: 3,
      },
      {
        id: "clicks",
        label: "Email Clicks",
        value: emailCur.clicks,
        prev: emailPrev.clicks,
        trend: trend(emailCur.clicks, emailPrev.clicks),
        rate: pct(emailCur.clicks, emailCur.opens),
        prevRate: pct(emailPrev.clicks, emailPrev.opens),
        format: "number",
        stage: 4,
      },
      {
        id: "referrals",
        label: "Referral Clicks",
        value: referralsCur.total,
        prev: referralsPrev.total,
        trend: trend(referralsCur.total, referralsPrev.total),
        format: "number",
        stage: 5,
      },
      {
        id: "replies",
        label: "Replies Generated",
        value: usageCur.total,
        prev: usagePrev.total,
        trend: trend(usageCur.total, usagePrev.total),
        format: "number",
        stage: 6,
      },
      {
        id: "feedback",
        label: "Feedback Submitted",
        value: feedbackCur.total,
        prev: feedbackPrev.total,
        trend: trend(feedbackCur.total, feedbackPrev.total),
        rate: pct(feedbackCur.up, feedbackCur.total),
        format: "number",
        stage: 6,
        extra: { up: feedbackCur.up, down: feedbackCur.down },
      },
    ];

    // Find biggest drop-off between adjacent funnel stages
    const stages = [signupsCur, emailCur.sent, emailCur.opens, emailCur.clicks, usageCur.total, feedbackCur.total];
    const labels = ["Signups", "Emails Sent", "Opens", "Clicks", "Replies", "Feedback"];
    let maxDrop = 0;
    let bottleneckIndex = 0;
    for (let i = 0; i < stages.length - 1; i++) {
      const drop = stages[i] > 0 ? 1 - stages[i + 1] / stages[i] : 0;
      if (drop > maxDrop) { maxDrop = drop; bottleneckIndex = i; }
    }

    const bottleneck = {
      from: labels[bottleneckIndex],
      to: labels[bottleneckIndex + 1],
      dropPct: Math.round(maxDrop * 100),
      suggestion: getSuggestion(bottleneckIndex),
    };

    res.json({ metrics, bottleneck, period, updatedAt: now.toISOString() });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ error: err.message });
  }
}

function getSuggestion(index) {
  const suggestions = [
    "Few signups → Drive more traffic to postfiat.vercel.app. Share the launch blog post in 2 more communities.",
    "Emails not sending → Check Brevo automation is active and the trigger list is correct.",
    "Low open rate → Test a stronger subject line. Try personalising with first name or a specific question.",
    "Low click rate → Make the CTA in Email 2 more specific. Link directly to a pre-filled example.",
    "Few replies generated → Users are clicking but not submitting. Simplify the first step — remove optional fields from view.",
    "Low feedback rate → Move the feedback widget higher — place it directly below the reply before copy/start-over buttons.",
  ];
  return suggestions[index] ?? "Review the funnel data to identify the next action.";
}
