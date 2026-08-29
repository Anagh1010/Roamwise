import { NextResponse } from "next/server";
import { concurrentTripUpdateResponse, getOwnedTrip, invalidPersistedItineraryResponse, parsePersistedItinerary, updateItineraryIfCurrent } from "@/lib/api/trips";
import { generateTravelDiary } from "@/lib/planner";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const result = await getOwnedTrip(request, id, "generate a travel diary");
  if ("error" in result) return result.error;
  const itinerary = parsePersistedItinerary(result.trip);
  if (!itinerary.success) return invalidPersistedItineraryResponse();
  try {
    const diary = await generateTravelDiary({ destination: result.trip.destination, totalBudget: result.trip.budget, currency: itinerary.data.currency, itinerary: itinerary.data, entries: itinerary.data.journalEntries });
    if (!await updateItineraryIfCurrent(result.trip, { ...itinerary.data, diary })) return concurrentTripUpdateResponse();
    return NextResponse.json({ diary });
  } catch (error) {
    console.error("AI travel diary generation failed", error);
    return NextResponse.json({ error: "Could not generate your travel diary." }, { status: 502 });
  }
}
