import { NextResponse } from "next/server";
import { concurrentTripUpdateResponse, getOwnedTrip, invalidPersistedItineraryResponse, parsePersistedItinerary, updateItineraryIfCurrent } from "@/lib/api/trips";
import { generateTravelBriefing } from "@/lib/planner";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: "GEMINI_API_KEY is required to generate a briefing." }, { status: 503 });

  const result = await getOwnedTrip(request, id, "generate a travel briefing");
  if ("error" in result) return result.error;

  const itinerary = parsePersistedItinerary(result.trip);
  if (!itinerary.success) return invalidPersistedItineraryResponse();

  try {
    const briefing = await generateTravelBriefing({ destination: result.trip.destination, itinerary: itinerary.data });
    const updatedItinerary = { ...itinerary.data, briefing };
    if (!await updateItineraryIfCurrent(result.trip, updatedItinerary)) return concurrentTripUpdateResponse();
    return NextResponse.json({ trip: { ...result.trip, itinerary: updatedItinerary } });
  } catch (error) {
    console.error("Travel briefing refresh failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not generate this travel briefing." }, { status: 502 });
  }
}

