import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { concurrentTripUpdateResponse, getOwnedTrip, invalidPersistedItineraryResponse, parsePersistedItinerary, updateItineraryIfCurrent } from "@/lib/api/trips";
import { journalEntrySchema, packingListSchema, persistedItinerarySchema, travelDiarySchema } from "@/lib/schemas/itinerary";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const result = await getOwnedTrip(request, id, "view saved trips");
  if ("error" in result) return result.error;
  return NextResponse.json({ trip: result.trip });
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const result = await getOwnedTrip(request, id, "delete trips");
  if ("error" in result) return result.error;

  try {
    await prisma.trip.delete({ where: { id: result.trip.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Saved trip deletion failed", error);
    return NextResponse.json({ error: "Could not delete this trip." }, { status: 500 });
  }
}

const tripUpdateSchema = z.object({
  packingList: packingListSchema.optional(),
  journalEntries: z.array(journalEntrySchema).optional(),
  diary: travelDiarySchema.optional(),
});

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const body = tripUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid trip update parameters." }, { status: 400 });

  const result = await getOwnedTrip(request, id, "update a trip");
  if ("error" in result) return result.error;

  const itinerary = parsePersistedItinerary(result.trip);
  if (!itinerary.success) return invalidPersistedItineraryResponse();

  const candidateItinerary = {
    ...itinerary.data,
    ...(body.data.packingList !== undefined ? { packingList: body.data.packingList } : {}),
    ...(body.data.journalEntries !== undefined ? { journalEntries: body.data.journalEntries } : {}),
    ...(body.data.diary !== undefined ? { diary: body.data.diary } : {}),
  };

  const validated = persistedItinerarySchema.safeParse(candidateItinerary);
  if (!validated.success) return NextResponse.json({ error: "Invalid updated itinerary." }, { status: 400 });

  try {
    if (!await updateItineraryIfCurrent(result.trip, validated.data)) return concurrentTripUpdateResponse();
    const updatedTrip = { ...result.trip, itinerary: validated.data };
    return NextResponse.json({ trip: updatedTrip });
  } catch (error) {
    console.error("Trip update failed", error);
    return NextResponse.json({ error: "Could not save your trip updates." }, { status: 500 });
  }
}

