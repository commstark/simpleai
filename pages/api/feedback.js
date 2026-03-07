export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { rating, comment, tone } = req.body;
  if (!rating) return res.status(400).json({ error: "Rating required" });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log("FEEDBACK:", { rating, comment, tone, at: new Date().toISOString() });
    return res.status(200).json({ ok: true });
  }

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/feedback`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ rating, comment, tone }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Supabase error:", text);
      return res.status(500).json({ error: "Failed to save feedback" });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Feedback error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
