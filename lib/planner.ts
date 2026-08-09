import { z } from "zod";
import { createDemoItinerary } from "./demo-itinerary";
import type { Itinerary, PlannerInput } from "./types";

// ── Zod schemas ───────────────────────────────────────────────────────────────

const usefulPhraseSchema = z.object({
  phrase: z.string(),
  translation: z.string(),
  pronunciation: z.string().optional(),
});

const briefingSchema = z.object({
  language: z.string().min(1).max(80).optional(),
  locale: z.string().min(2).max(20).optional(),
  generatedAt: z.string().datetime().optional(),
  source: z.enum(["ai", "demo"]).optional(),
  culturalEtiquette: z.array(z.string()).min(2).max(8),
  localCustoms: z.array(z.string()).min(2).max(8),
  usefulPhrases: z.array(usefulPhraseSchema).min(4).max(12),
  safetyAdvice: z.array(z.string()).min(2).max(8),
});

export const itinerarySchema = z.object({
  title: z.string(),
  overview: z.string(),
  currency: z.string().optional().default("USD"),
  totalEstimatedCost: z.number().finite(),
  packingTips: z.array(z.string()),
  briefing: briefingSchema.optional(),
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

// ── Gemini API response schemas (enforces complete, valid JSON at API level) ──

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

const usefulPhraseResponseSchema = {
  type: "OBJECT",
  properties: {
    phrase: { type: "STRING" },
    translation: { type: "STRING" },
    pronunciation: { type: "STRING" },
  },
  required: ["phrase", "translation"],
};

const briefingResponseSchema = {
  type: "OBJECT",
  properties: {
    language: { type: "STRING" },
    locale: { type: "STRING" },
    culturalEtiquette: { type: "ARRAY", items: { type: "STRING" } },
    localCustoms: { type: "ARRAY", items: { type: "STRING" } },
    usefulPhrases: { type: "ARRAY", items: usefulPhraseResponseSchema },
    safetyAdvice: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["language", "locale", "culturalEtiquette", "localCustoms", "usefulPhrases", "safetyAdvice"],
};

const itineraryResponseSchema = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    overview: { type: "STRING" },
    currency: { type: "STRING" },
    totalEstimatedCost: { type: "NUMBER" },
    packingTips: { type: "ARRAY", items: { type: "STRING" } },
    briefing: briefingResponseSchema,
    days: { type: "ARRAY", items: dayResponseSchema },
  },
  required: ["title", "overview", "currency", "totalEstimatedCost", "packingTips", "briefing", "days"],
};

const itineraryWithoutBriefingResponseSchema = {
  ...itineraryResponseSchema,
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

// ── Types ──────────────────────────────────────────────────────────────────────

type RevisionInput = {
  destination: string;
  budget: number;
  request: string;
  itinerary: Itinerary;
};
type BriefingInput = { destination: string; itinerary: Itinerary };

type GeminiPart = { text?: string; thought?: boolean };

function getGeminiJson(result: { candidates?: Array<{ content?: { parts?: GeminiPart[] } }> }) {
  const text = result.candidates?.[0]?.content?.parts
    ?.filter((part) => !part.thought)
    .map((part) => part.text ?? "")
    .join("") || "{}";
  return text.replace(/^```json\s*|\s*```$/gi, "");
}

function geminiModel() {
  return process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
}

export async function generateTravelBriefing(input: BriefingInput) {
  if (!process.env.GEMINI_API_KEY) throw new Error("Add GEMINI_API_KEY to generate a travel briefing.");
  try {
    const system = "You are a careful travel briefing assistant. Return only valid JSON. Give specific, practical, respectful destination guidance. Do not present safety guidance as official or real-time; tell travelers to consult their own government's official advisories for current conditions.";
    const prompt = `Create a briefing for ${input.destination}. Include language, locale, culturalEtiquette (4-6 do's and don'ts), localCustoms (4-6 notes on greetings, dining, dress and tipping), usefulPhrases (8-10 local phrases with English translation and romanised pronunciation where useful), and safetyAdvice (4-6 practical destination-specific tips). Current trip: ${JSON.stringify({ dates: input.itinerary.days.map((day) => day.date), interests: input.itinerary.title })}`;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel()}:generateContent`, {
      method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
      body: JSON.stringify({ system_instruction: { parts: [{ text: system }] }, contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", responseSchema: briefingResponseSchema, maxOutputTokens: 4096 } })
    });
    if (!response.ok) throw new Error(`AI provider request failed: ${response.status}`);
    const parsed = briefingSchema.safeParse(JSON.parse(getGeminiJson(await response.json())));
    if (!parsed.success) throw new Error("The AI response did not contain a valid travel briefing.");
    return { ...parsed.data, source: "ai" as const, generatedAt: new Date().toISOString() };
  } catch (error) {
    console.error("Travel briefing generation failed", error);
    throw error instanceof Error ? error : new Error("Could not generate this travel briefing.");
  }
}

export async function answerBriefingQuestion(input: BriefingInput & { question: string }) {
  if (!process.env.GEMINI_API_KEY) throw new Error("Add GEMINI_API_KEY to ask briefing questions.");
  const answerSchema = z.object({ answer: z.string().min(1).max(900) });
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel()}:generateContent`, {
      method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
      body: JSON.stringify({ system_instruction: { parts: [{ text: "You are a concise travel briefing assistant. Answer using the trip's saved briefing. Do not invent real-time safety information; advise official government sources for current restrictions, emergencies, or safety conditions. Return only valid JSON." }] }, contents: [{ role: "user", parts: [{ text: `Destination: ${input.destination}\nSaved briefing: ${JSON.stringify(input.itinerary.briefing)}\nQuestion: ${input.question}` }] }], generationConfig: { responseMimeType: "application/json", responseSchema: { type: "OBJECT", properties: { answer: { type: "STRING" } }, required: ["answer"] }, maxOutputTokens: 1024 } })
    });
    if (!response.ok) throw new Error(`AI provider request failed: ${response.status}`);
    const parsed = answerSchema.safeParse(JSON.parse(getGeminiJson(await response.json())));
    if (!parsed.success) throw new Error("The AI response did not contain a valid answer.");
    return parsed.data.answer;
  } catch (error) {
    console.error("Travel briefing question failed", error);
    throw error instanceof Error ? error : new Error("Could not answer this briefing question.");
  }
}

// ── Revision ───────────────────────────────────────────────────────────────────

export async function reviseItinerary(input: RevisionInput): Promise<{ itinerary: Itinerary; summary: string; changedDayNumbers: number[] }> {
  if (!process.env.GEMINI_API_KEY) throw new Error("Add GEMINI_API_KEY to revise a saved itinerary.");
  const revisionSchema = z.object({
    summary: z.string().min(1).max(240),
    changedDayNumbers: z.array(z.number().int().positive()).max(30),
    itinerary: itinerarySchema
  });

  const currency = input.itinerary.currency || "USD";
  // Preserve existing briefing so revision stays fast and focused
  const existingBriefing = input.itinerary.briefing;

  try {
    const system = `You are an expert travel designer editing an existing itinerary. Return only valid JSON. Make the smallest practical change that fulfills the request. Preserve days, dates, and any unaffected activities. Keep activities geographically sensible, prices in ${currency} per person, and the total cost at or below the trip budget unless the user explicitly asks otherwise. Set "currency": "${currency}" in the itinerary object. Preserve the existing briefing object exactly as provided unless the user's request is specifically about cultural, customs, phrases, or safety information.`;
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
    // Always restore the original briefing — revision doesn't regenerate it
    const finalItinerary: Itinerary = {
      ...parsed.data.itinerary,
      currency,
      briefing: parsed.data.itinerary.briefing ?? existingBriefing,
    };
    return { ...parsed.data, itinerary: finalItinerary };
  } catch (error) {
    console.error("AI itinerary revision failed", error);
    throw error instanceof Error ? error : new Error("Could not revise this itinerary.");
  }
}

// ── Build ──────────────────────────────────────────────────────────────────────

export async function buildItinerary(input: PlannerInput): Promise<{ itinerary: Itinerary; source: "ai" | "demo" }> {
  if (!process.env.GEMINI_API_KEY) return { itinerary: createDemoItinerary(input), source: "demo" };
  const currency = input.currency || "USD";
  try {
    const includeBriefing = input.includeBriefing !== false;
    const system = `You are an expert travel designer. Return only valid JSON. Create practical itinerary activities near each other. Prices are in ${currency} per person. Always include "currency": "${currency}" in your JSON response.${includeBriefing ? " Also generate a travel briefing for the destination with: culturalEtiquette (specific do's and don'ts, 4-6 items), localCustoms (norms around tipping, greetings, dress, dining, 4-6 items), usefulPhrases (8-10 essential local language phrases with English translation and romanised pronunciation where applicable), and safetyAdvice (practical safety tips specific to the destination, 4-6 items)." : " Do not include a briefing object."}`;
    const prompt = `Create a travel itinerary for this trip in ${currency}: ${JSON.stringify(input)}`;
    const model = process.env.GEMINI_MODEL || "gemini-3.5-flash";
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", responseSchema: includeBriefing ? itineraryResponseSchema : itineraryWithoutBriefingResponseSchema, maxOutputTokens: 10000 }
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
