import { NextResponse } from "next/server";
import { generateTravelBriefing, itinerarySchema } from "@/lib/planner";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase";

type RouteContext = { params: { id: string } };

export async function POST(request: Request, { params }: RouteContext) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Sign in to generate a travel briefing." }, { status: 401 });
  if (!process.env.DATABASE_URL || !process.env.GEMINI_API_KEY) return NextResponse.json({ error: "A database connection and GEMINI_API_KEY are required to generate a briefing." }, { status: 503 });
  try {
    const trip = await prisma.trip.findFirst({ where: { id: params.id, userId: user.id } });
    if (!trip) return NextResponse.json({ error: "Trip not found." }, { status: 404 });
    const itinerary = itinerarySchema.safeParse(trip.itinerary);
    if (!itinerary.success) return NextResponse.json({ error: "This saved itinerary is incomplete and cannot be briefed." }, { status: 422 });
    const briefing = await generateTravelBriefing({ destination: trip.destination, itinerary: itinerary.data });
    const updatedTrip = await prisma.trip.update({ where: { id: trip.id }, data: { itinerary: { ...itinerary.data, briefing } } });
    return NextResponse.json({ trip: updatedTrip });
  } catch (error) {
    console.error("Travel briefing refresh failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not generate this travel briefing." }, { status: 502 });
  }
}
