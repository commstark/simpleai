import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const rateLimitMap = new Map();
const RATE_LIMIT = 10;

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

const goalDescriptions = {
  retain:    { goal: "retain this customer and make them feel genuinely valued enough to return", tone: "warm and sincere" },
  apologize: { goal: "take full accountability and sincerely apologize for the experience", tone: "empathetic and humble" },
  resolve:   { goal: "acknowledge the issue and offer a clear, practical resolution", tone: "direct and solution-focused" },
  thanks:    { goal: "express genuine appreciation for their positive feedback and encourage them to return", tone: "enthusiastic and personal" },
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: "You've hit the daily limit of 10 replies. Come back tomorrow!" });
  }

  const { message, goal, customerName, businessType } = req.body;

  if (!message || message.trim().length < 5) {
    return res.status(400).json({ error: "Please paste a customer message to reply to." });
  }

  const { goal: goalDesc, tone } = goalDescriptions[goal] || goalDescriptions.retain;
  const bizContext = businessType ? `The business is a ${businessType}.` : "";
  const nameInstruction = customerName
    ? `Address the customer by their first name: "${customerName}" (e.g. "Hi ${customerName}," or "Dear ${customerName},").`
    : "Use a warm generic greeting (e.g. 'Hi there,' or 'Dear valued customer,').";

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      messages: [
        {
          role: "user",
          content: `You are a helpful assistant writing customer reply emails for a small business owner. ${bizContext}

Your goal for this reply: ${goalDesc}. Tone: ${tone}.

${nameInstruction}

Keep the reply concise (3-5 sentences), genuine, and easy to read. Do not include a subject line. Start directly with the greeting.

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
