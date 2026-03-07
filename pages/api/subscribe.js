const BREVO_API = "https://api.brevo.com/v3";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://postfiat.vercel.app");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const { email } = req.body;
  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Valid email required" });
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error("BREVO_API_KEY not set");
    return res.status(500).json({ error: "Server configuration error" });
  }

  try {
    const response = await fetch(`${BREVO_API}/contacts`, {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        email,
        listIds: [2],
        updateEnabled: true,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      // 400 with "Contact already exist" is fine
      if (data.code === "duplicate_parameter") {
        return res.status(200).json({ ok: true });
      }
      console.error("Brevo error:", data);
      return res.status(500).json({ error: "Failed to subscribe" });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Subscribe error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
