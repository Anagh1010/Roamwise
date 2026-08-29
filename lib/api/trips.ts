import { Prisma, type Trip } from "@prisma/client";
import { NextResponse } from "next/server";
import { persistedItinerarySchema, type PersistedItinerary } from "@/lib/schemas/itinerary";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase";

export async function getOwnedTrip(request: Request, id: string, action: string) {
  const user = await getAuthenticatedUser(request);
  if (!user) return { error: NextResponse.json({ error: `Sign in to ${action}.` }, { status: 401 }) };
  if (!process.env.DATABASE_URL) return { error: NextResponse.json({ error: "Database not configured." }, { status: 503 }) };
  const trip = await prisma.trip.findFirst({ where: { id, userId: user.id } });
  if (!trip) return { error: NextResponse.json({ error: "Trip not found." }, { status: 404 }) };
  return { trip };
}

export function parsePersistedItinerary(trip: Trip) {
  return persistedItinerarySchema.safeParse(trip.itinerary);
}

export async function updateItineraryIfCurrent(trip: Trip, itinerary: PersistedItinerary) {
  const result = await prisma.trip.updateMany({
    where: { id: trip.id, updatedAt: trip.updatedAt },
    data: { itinerary: itinerary as Prisma.InputJsonValue },
  });
  return result.count === 1;
}

export function invalidPersistedItineraryResponse() {
  return NextResponse.json({ error: "This saved itinerary is invalid and must be repaired before it can be changed." }, { status: 422 });
}

export function concurrentTripUpdateResponse() {
  return NextResponse.json({ error: "This trip changed elsewhere. Refresh and try again." }, { status: 409 });
}
