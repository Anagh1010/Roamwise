import { z } from "zod";
import { createDemoItinerary } from "./demo-itinerary";
import type { Itinerary, PlannerInput } from "./types";

export const itinerarySchema = z.object({
  title: z.string(), overview: z.string(), totalEstimatedCost: z.number().finite(), packingTips: z.array(z.string()),
  days: z.array(z.object({ day: z.number().int().positive(), date: z.string(), theme: z.string(), activities: z.array(z.object({
    time: z.string(), title: z.string(), place: z.string(), description: z.string(),
    kind: z.enum(["stay", "food", "explore", "move"]), cost: z.number().finite(), duration: z.string()
  })) }))
});

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

  try {
    const system = "You are an expert travel designer editing an existing itinerary. Return only valid JSON. Make the smallest practical change that fulfills the request. Preserve days, dates, and any unaffected activities. Keep activities geographically sensible, prices in USD per person, and the total cost at or below the trip budget unless the user explicitly asks otherwise.";
    const prompt = `Return this exact JSON schema: {summary:string,changedDayNumbers:number[],itinerary:{title,overview,totalEstimatedCost,packingTips:string[],days:[{day,date,theme,activities:[{time,title,place,description,kind:stay|food|explore|move,cost,duration}]}]}}.\nTrip destination: ${input.destination}\nBudget: $${input.budget}\nUser request: ${input.request}\nCurrent itinerary: ${JSON.stringify(input.itinerary)}`;
    const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", maxOutputTokens: 8192, thinkingConfig: { thinkingLevel: "minimal" } }
      })
    });
    if (!response.ok) throw new Error(`AI provider request failed: ${response.status}`);
    const result = await response.json();
    const parsed = revisionSchema.safeParse(JSON.parse(getGeminiJson(result)));
    if (!parsed.success) throw new Error("The AI response did not contain a valid itinerary.");
    if (parsed.data.itinerary.days.length !== input.itinerary.days.length || parsed.data.itinerary.days.some((day, index) => day.day !== input.itinerary.days[index]?.day || day.date !== input.itinerary.days[index]?.date)) {
      throw new Error("The AI response changed the trip dates. Please try again.");
    }
    return parsed.data;
  } catch (error) {
    console.error("AI itinerary revision failed", error);
    throw error instanceof Error ? error : new Error("Could not revise this itinerary.");
  }
}

export async function buildItinerary(input: PlannerInput): Promise<{ itinerary: Itinerary; source: "ai" | "demo" }> {
  if (!process.env.GEMINI_API_KEY) return { itinerary: createDemoItinerary(input), source: "demo" };
  try {
    const system = "You are an expert travel designer. Return only valid JSON. Create practical itinerary activities near each other. Prices are USD per person. Match the exact requested schema.";
    const prompt = `Create this JSON schema: {title,overview,totalEstimatedCost,packingTips:string[],days:[{day,date,theme,activities:[{time,title,place,description,kind:stay|food|explore|move,cost,duration}]}]}. Plan: ${JSON.stringify(input)}`;
    const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", maxOutputTokens: 8192, thinkingConfig: { thinkingLevel: "minimal" } }
      })
    });
    if (!response.ok) throw new Error(`AI provider request failed: ${response.status}`);
    const result = await response.json();
    const parsed = itinerarySchema.safeParse(JSON.parse(getGeminiJson(result)));
    if (!parsed.success) {
      console.error("AI itinerary validation failed", parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })));
      throw new Error("The AI response did not contain a valid itinerary.");
    }
    return { itinerary: parsed.data, source: "ai" };
  } catch (error) {
    console.error("AI itinerary generation failed", error);
    throw new Error("The AI itinerary could not be completed. Please try again.");
  }
}
