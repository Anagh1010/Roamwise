import { NextResponse } from "next/server";
import { z } from "zod";
import { concurrentTripUpdateResponse, getOwnedTrip, invalidPersistedItineraryResponse, parsePersistedItinerary, updateItineraryIfCurrent } from "@/lib/api/trips";
import { persistedItinerarySchema } from "@/lib/schemas/itinerary";
import { reviseItinerary } from "@/lib/planner";

type RouteContext = { params: Promise<{ id: string }> };
const requestSchema = z.object({ request: z.string().trim().min(4).max(600) });

export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const body = requestSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Describe the change you would like to make." }, { status: 400 });
  if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: "GEMINI_API_KEY is required to revise a saved itinerary." }, { status: 503 });
  const result = await getOwnedTrip(request, id, "revise saved trips");
  if ("error" in result) return result.error;
  const itinerary = parsePersistedItinerary(result.trip);
  if (!itinerary.success) return invalidPersistedItineraryResponse();
  try {
    const revision = await reviseItinerary({ destination: result.trip.destination, budget: result.trip.budget, request: body.data.request, itinerary: itinerary.data });
    const updated = persistedItinerarySchema.safeParse(revision.itinerary);
    if (!updated.success) throw new Error("The revised itinerary was invalid.");
    if (!await updateItineraryIfCurrent(result.trip, updated.data)) return concurrentTripUpdateResponse();
    const updatedTrip = { ...result.trip, itinerary: updated.data };
    return NextResponse.json({ trip: updatedTrip, itinerary: updated.data, summary: revision.summary, changedDayNumbers: revision.changedDayNumbers });
  } catch (error) {
    console.error("Saved trip revision failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not revise this itinerary." }, { status: 502 });
  }
}
