import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Simple in-memory rate limiting (resets on serverless cold start)
const rateLimitMap = new Map();
const RATE_LIMIT = 10; // requests per IP per day

function checkRateLimit(ip) {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const entry = rateLimitMap.get(ip) || { count: 0, resetAt: now + dayMs };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + dayMs;
  }
  entry.count++;
  rateLimitMap.set(ip, entry);
  return entry.count <= RATE_LIMIT;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: "You've hit the daily limit of 10 replies. Come back tomorrow!" });
  }

  const { message, tone, businessType } = req.body;

  if (!message || message.trim().length < 5) {
    return res.status(400).json({ error: "Please paste a customer message to reply to." });
  }

  const toneDescriptions = {
    friendly: "warm, friendly, and approachable",
    professional: "professional and formal",
    apologetic: "apologetic and empathetic",
    concise: "brief and to the point",
  };

  const toneDesc = toneDescriptions[tone] || "friendly and professional";
  const bizContext = businessType ? `The business is a ${businessType}.` : "";

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      messages: [
        {
          role: "user",
          content: `You are a helpful assistant writing customer reply emails for a small business owner. ${bizContext}

Write a ${toneDesc} reply to this customer message. Keep it concise (3-5 sentences max), genuine, and easy to read. Do not include a subject line. Start directly with the greeting.

Customer message:
"${message}"

Write only the reply, nothing else.`,
        },
      ],
    });

    const reply = response.content[0]?.text || "";
    res.status(200).json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong. Please try again in a moment." });
  }
}
