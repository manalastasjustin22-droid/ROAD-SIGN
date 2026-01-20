import fetch from "node-fetch";
import dotenv from "dotenv";
import { cache } from "./cache.js";
dotenv.config();

export async function getAISuggestions({ className, confidence, imageUrl }) {
  // changed 'disease' to 'className'
  const cacheKey = `ai_${className.toLowerCase().replace(/\s+/g, "_")}_${confidence}`;

  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const prompt = `
You are an expert Autonomous Driving and Traffic Safety Analyst.

You must return your answer strictly as a JSON object with the following keys:
{
  "description": "Short explanation of the object and its context",
  "action": "Immediate recommended action based on the confidence level",
  "safety_rule": "The specific traffic rule that applies here"
}

Do not include any commentary, markdown, or additional text — only valid JSON.
`;

  // Updated question context
  const question = `Detected Object: ${className}\nConfidence: ${confidence}%${imageUrl ? `\nImage: ${imageUrl}` : ""}. 
  If confidence is low (below 70%), suggest caution and manual verification.`;

  const res = await fetch(process.env.GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama3-70b-8192",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: question },
      ],
      temperature: 0.3,
      max_tokens: 800,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Groq API failed: ${res.status} - ${error}`);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content || "";

  try {
    const parsed = JSON.parse(raw);
    const result = {
      description: parsed.description?.trim() || "",
      action: parsed.action?.trim() || "",
      safety_rule: parsed.safety_rule?.trim() || "",
    };

    cache.set(cacheKey, result);
    return result;
  } catch (err) {
    throw new Error("Failed to parse AI JSON response: " + err.message + "\nRaw response: " + raw);
  }
}