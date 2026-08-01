import { NextResponse } from "next/server";
import { z } from "zod";
import { itinerarySchema, reviseItinerary } from "@/lib/planner";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase";

type RouteContext = { params: { id: string } };
const requestSchema = z.object({ request: z.string().trim().min(4).max(600) });

export async function POST(request: Request, { params }: RouteContext) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Sign in to revise saved trips." }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Add DATABASE_URL to revise saved trips." }, { status: 503 });
  if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: "Add GEMINI_API_KEY to revise a saved itinerary." }, { status: 503 });
  const body = requestSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Describe the change you would like to make." }, { status: 400 });

  try {
    const trip = await prisma.trip.findFirst({ where: { id: params.id, userId: user.id } });
    if (!trip) return NextResponse.json({ error: "Trip not found." }, { status: 404 });
    const itinerary = itinerarySchema.safeParse(trip.itinerary);
    if (!itinerary.success) return NextResponse.json({ error: "This saved itinerary is incomplete and cannot be revised." }, { status: 422 });
    const revision = await reviseItinerary({ destination: trip.destination, budget: trip.budget, request: body.data.request, itinerary: itinerary.data });
    const updatedTrip = await prisma.trip.update({ where: { id: trip.id }, data: { itinerary: revision.itinerary } });
    return NextResponse.json({ trip: updatedTrip, summary: revision.summary, changedDayNumbers: revision.changedDayNumbers });
  } catch (error) {
    console.error("Saved trip revision failed", error);
    const message = error instanceof Error ? error.message : "Could not revise this itinerary.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
