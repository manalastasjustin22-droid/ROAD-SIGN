// lib/getObjectInfo.js

import dotenv from "dotenv";
import fetch from "node-fetch";
import { getObjectList } from "./getObjectList.js";
import { cache } from "./cache.js";

dotenv.config();

const MODEL = "llama3-70b-8192";
const GROQ_URL = process.env.GROQ_API_URL;
const GROQ_KEY = process.env.GROQ_API_KEY;
// SOURCE_URL is removed as we aren't scraping specific external wikis anymore
const COMBINED_CACHE_KEY = "combined_object_info";

const slug = (name) => name.toLowerCase().replace(/\s+/g, "_");

// 1. Replaced Scraper with Static Images
const STATIC_IMAGES = {
  "vehicle": "https://cdn-icons-png.flaticon.com/512/3202/3202926.png", // Generic Car/Vehicle Icon
  "traffic_sign": "https://cdn-icons-png.flaticon.com/512/3063/3063822.png", // Generic Stop Sign Icon
  "pedestrian": "https://cdn-icons-png.flaticon.com/512/10/10601.png", // Generic Pedestrian Icon
};

async function getObjectText(objectName) {
  const cacheKey = `object_info_${slug(objectName)}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  // 2. Updated Prompt for Traffic Safety
  const prompt = `
You are an expert Autonomous Driving and Traffic Safety Analyst.

Your task is to provide structured data for the following traffic object: "${objectName}".

Return strictly a valid JSON with this structure:
{
  "description": "A brief definition of the object (e.g., 'A motorized vehicle used for transport').",
  "action": "Immediate action required by a driver or pedestrian (e.g., 'Stop immediately', 'Yield right of way').",
  "safety_rule": "Relevant traffic rule or safety context."
}
Do not add extra text, markdown, commentary, or image links.`;

  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: `Give general safety info for: ${objectName}` },
        ],
        temperature: 0.3,
        max_tokens: 900,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Groq API failed for "${objectName}": ${res.status} - ${error}`);
    }

    const json = await res.json();
    const raw = json.choices?.[0]?.message?.content || "";
    const parsed = JSON.parse(raw);

    const result = {
      class_name: objectName,
      description: parsed.description?.trim() || "",
      action: parsed.action?.trim() || "",
      safety_rule: parsed.safety_rule?.trim() || "",
    };

    cache.set(cacheKey, result);
    return result;
  } catch (err) {
    console.error(`[Groq Error: ${objectName}] ${err.message}`);
    return {
      class_name: objectName,
      description: "Error generating description.",
      action: "Error generating action.",
      safety_rule: "Error generating safety rule.",
      error: true,
    };
  }
}

export async function getObjectInfo() {
  const cached = cache.get(COMBINED_CACHE_KEY);
  if (cached) return cached;

  const objectList = await getObjectList();

  const results = await Promise.all(
    objectList.map(async (objName) => {
      const text = await getObjectText(objName);
      // Map the object name to the static image key
      const image = STATIC_IMAGES[slug(objName)] || "https://via.placeholder.com/150"; 
      return { ...text, image };
    })
  );

  cache.set(COMBINED_CACHE_KEY, results);
  return results;
}