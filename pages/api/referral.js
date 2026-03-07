const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

async function countReferrals(code) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/referrals?referrer_code=eq.${encodeURIComponent(code)}&select=id`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Prefer: "count=exact",
      },
    }
  );
  const range = res.headers.get("content-range") || "*/0";
  return parseInt(range.split("/")[1] || "0", 10);
}

async function trackReferral(referrerCode) {
  await fetch(`${SUPABASE_URL}/rest/v1/referrals`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ referrer_code: referrerCode }),
  });
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET") {
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: "code required" });
    try {
      const count = await countReferrals(code);
      return res.status(200).json({ count });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === "POST") {
    const { referrerCode } = req.body;
    if (!referrerCode) return res.status(400).json({ error: "referrerCode required" });
    try {
      await trackReferral(referrerCode);
      return res.status(200).json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).end();
}
