import { z } from "zod";
import { createDemoItinerary } from "./demo-itinerary";
import type { Itinerary, PlannerInput } from "./types";

export const itinerarySchema = z.object({
  title: z.string(),
  overview: z.string(),
  currency: z.string().optional().default("USD"),
  totalEstimatedCost: z.number().finite(),
  packingTips: z.array(z.string()),
  days: z.array(z.object({
    day: z.number().int().positive(),
    date: z.string(),
    theme: z.string(),
    activities: z.array(z.object({
      time: z.string(),
      title: z.string(),
      place: z.string(),
      description: z.string(),
      kind: z.enum(["stay", "food", "explore", "move"]),
      cost: z.number().finite(),
      duration: z.string()
    }))
  }))
});

// Gemini API response schemas — enforces complete, valid JSON output at the API level.
const activityResponseSchema = {
  type: "OBJECT",
  properties: {
    time: { type: "STRING" },
    title: { type: "STRING" },
    place: { type: "STRING" },
    description: { type: "STRING" },
    kind: { type: "STRING", enum: ["stay", "food", "explore", "move"] },
    cost: { type: "NUMBER" },
    duration: { type: "STRING" },
  },
  required: ["time", "title", "place", "description", "kind", "cost", "duration"],
};

const dayResponseSchema = {
  type: "OBJECT",
  properties: {
    day: { type: "INTEGER" },
    date: { type: "STRING" },
    theme: { type: "STRING" },
    activities: { type: "ARRAY", items: activityResponseSchema },
  },
  required: ["day", "date", "theme", "activities"],
};

const itineraryResponseSchema = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    overview: { type: "STRING" },
    currency: { type: "STRING" },
    totalEstimatedCost: { type: "NUMBER" },
    packingTips: { type: "ARRAY", items: { type: "STRING" } },
    days: { type: "ARRAY", items: dayResponseSchema },
  },
  required: ["title", "overview", "currency", "totalEstimatedCost", "packingTips", "days"],
};

const revisionResponseSchema = {
  type: "OBJECT",
  properties: {
    summary: { type: "STRING" },
    changedDayNumbers: { type: "ARRAY", items: { type: "INTEGER" } },
    itinerary: itineraryResponseSchema,
  },
  required: ["summary", "changedDayNumbers", "itinerary"],
};

type RevisionInput = {
  destination: string;
  budget: number;
  request: string;
  itinerary: Itinerary;
};

type GeminiPart = { text?: string; thought?: boolean };

function getGeminiJson(result: { candidates?: Array<{ content?: { parts?: GeminiPart[] } }> }) {
  const text = result.candidates?.[0]?.content?.parts
    ?.filter((part) => !part.thought)
    .map((part) => part.text ?? "")
    .join("") || "{}";
  return text.replace(/^```json\s*|\s*```$/gi, "");
}

export async function reviseItinerary(input: RevisionInput): Promise<{ itinerary: Itinerary; summary: string; changedDayNumbers: number[] }> {
  if (!process.env.GEMINI_API_KEY) throw new Error("Add GEMINI_API_KEY to revise a saved itinerary.");
  const revisionSchema = z.object({
    summary: z.string().min(1).max(240),
    changedDayNumbers: z.array(z.number().int().positive()).max(30),
    itinerary: itinerarySchema
  });

  const currency = input.itinerary.currency || "USD";
  try {
    const system = `You are an expert travel designer editing an existing itinerary. Return only valid JSON. Make the smallest practical change that fulfills the request. Preserve days, dates, and any unaffected activities. Keep activities geographically sensible, prices in ${currency} per person, and the total cost at or below the trip budget unless the user explicitly asks otherwise. Set "currency": "${currency}" in the itinerary object.`;
    const prompt = `Trip destination: ${input.destination}\nBudget: ${currency} ${input.budget}\nUser request: ${input.request}\nCurrent itinerary: ${JSON.stringify(input.itinerary)}`;
    const model = process.env.GEMINI_MODEL || "gemini-3.5-flash";
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", responseSchema: revisionResponseSchema, maxOutputTokens: 8192 }
      })
    });
    if (!response.ok) throw new Error(`AI provider request failed: ${response.status}`);
    const result = await response.json();
    const parsed = revisionSchema.safeParse(JSON.parse(getGeminiJson(result)));
    if (!parsed.success) throw new Error("The AI response did not contain a valid itinerary.");
    if (parsed.data.itinerary.days.length !== input.itinerary.days.length || parsed.data.itinerary.days.some((day, index) => day.day !== input.itinerary.days[index]?.day || day.date !== input.itinerary.days[index]?.date)) {
      throw new Error("The AI response changed the trip dates. Please try again.");
    }
    const finalItinerary: Itinerary = { ...parsed.data.itinerary, currency };
    return { ...parsed.data, itinerary: finalItinerary };
  } catch (error) {
    console.error("AI itinerary revision failed", error);
    throw error instanceof Error ? error : new Error("Could not revise this itinerary.");
  }
}

export async function buildItinerary(input: PlannerInput): Promise<{ itinerary: Itinerary; source: "ai" | "demo" }> {
  if (!process.env.GEMINI_API_KEY) return { itinerary: createDemoItinerary(input), source: "demo" };
  const currency = input.currency || "USD";
  try {
    const system = `You are an expert travel designer. Return only valid JSON. Create practical itinerary activities near each other. Prices are in ${currency} per person. Always include "currency": "${currency}" in your JSON response.`;
    const prompt = `Create a travel itinerary for this trip in ${currency}: ${JSON.stringify(input)}`;
    const model = process.env.GEMINI_MODEL || "gemini-3.5-flash";
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", responseSchema: itineraryResponseSchema, maxOutputTokens: 8192 }
      })
    });
    if (!response.ok) throw new Error(`AI provider request failed: ${response.status}`);
    const result = await response.json();
    const parsed = itinerarySchema.safeParse(JSON.parse(getGeminiJson(result)));
    if (!parsed.success) {
      console.error("AI itinerary validation failed", parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })));
      throw new Error("The AI response did not contain a valid itinerary.");
    }
    const finalItinerary: Itinerary = { ...parsed.data, currency };
    return { itinerary: finalItinerary, source: "ai" };
  } catch (error) {
    console.error("AI itinerary generation failed", error);
    throw new Error("The AI itinerary could not be completed. Please try again.");
  }
}
