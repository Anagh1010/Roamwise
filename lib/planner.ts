import { z } from "zod";
import { createDemoItinerary } from "./demo-itinerary";
import type { Itinerary, PlannerInput } from "./types";

const itinerarySchema = z.object({
  title: z.string(), overview: z.string(), totalEstimatedCost: z.number(), packingTips: z.array(z.string()),
  days: z.array(z.object({ day: z.number(), date: z.string(), theme: z.string(), activities: z.array(z.object({
    time: z.string(), title: z.string(), place: z.string(), description: z.string(),
    kind: z.enum(["stay", "food", "explore", "move"]), cost: z.number(), duration: z.string()
  })) }))
});

export async function buildItinerary(input: PlannerInput): Promise<{ itinerary: Itinerary; source: "ai" | "demo" }> {
  if (!process.env.GEMINI_API_KEY) return { itinerary: createDemoItinerary(input), source: "demo" };
  try {
    const system = "You are an expert travel designer. Return only valid JSON. Create practical itinerary activities near each other. Prices are USD per person. Match the exact requested schema.";
    const prompt = `Create this JSON schema: {title,overview,totalEstimatedCost,packingTips:string[],days:[{day,date,theme,activities:[{time,title,place,description,kind:stay|food|explore|move,cost,duration}]}]}. Plan: ${JSON.stringify(input)}`;
    const model = process.env.GEMINI_MODEL || "gemini-3.5-flash";
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, responseMimeType: "application/json" }
      })
    });
    if (!response.ok) throw new Error(`AI provider request failed: ${response.status}`);
    const result = await response.json();
    const content = (result.candidates?.[0]?.content?.parts?.[0]?.text || "{}").replace(/^```json\s*|\s*```$/g, "");
    const parsed = itinerarySchema.safeParse(JSON.parse(content));
    if (parsed.success) return { itinerary: parsed.data, source: "ai" };
  } catch (error) {
    console.error("AI itinerary generation failed", error);
  }
  return { itinerary: createDemoItinerary(input), source: "demo" };
}
