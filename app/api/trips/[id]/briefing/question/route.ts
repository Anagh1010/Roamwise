import { NextResponse } from "next/server";
import { z } from "zod";
import { getOwnedTrip, invalidPersistedItineraryResponse, parsePersistedItinerary } from "@/lib/api/trips";
import { answerBriefingQuestion } from "@/lib/planner";

type RouteContext = { params: Promise<{ id: string }> };
const bodySchema = z.object({ question: z.string().trim().min(3).max(300) });

export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Ask a short travel briefing question." }, { status: 400 });
  if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: "GEMINI_API_KEY is required to answer briefing questions." }, { status: 503 });

  const result = await getOwnedTrip(request, id, "ask travel briefing questions");
  if ("error" in result) return result.error;

  const itinerary = parsePersistedItinerary(result.trip);
  if (!itinerary.success) return invalidPersistedItineraryResponse();
  if (!itinerary.data.briefing) return NextResponse.json({ error: "Generate a travel briefing first." }, { status: 422 });

  try {
    const answer = await answerBriefingQuestion({ destination: result.trip.destination, itinerary: itinerary.data, question: body.data.question });
    return NextResponse.json({ answer });
  } catch (error) {
    console.error("Travel briefing question failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not answer this question." }, { status: 502 });
  }
}

