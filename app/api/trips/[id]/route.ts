import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase";
import { journalEntrySchema, packingListSchema, travelDiarySchema } from "@/lib/planner";

type RouteContext = { params: { id: string } };

export async function GET(request: Request, { params }: RouteContext) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Sign in to view saved trips." }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Add DATABASE_URL to view saved trips." }, { status: 503 });

  try {
    const trip = await prisma.trip.findFirst({ where: { id: params.id, userId: user.id } });
    if (!trip) return NextResponse.json({ error: "Trip not found." }, { status: 404 });
    return NextResponse.json({ trip });
  } catch (error) {
    console.error("Saved trip load failed", error);
    return NextResponse.json({ error: "Could not load this trip. Check your database connection." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Sign in to delete trips." }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database not configured." }, { status: 503 });

  try {
    const deleted = await prisma.trip.deleteMany({
      where: { id: params.id, userId: user.id }
    });
    if (deleted.count === 0) return NextResponse.json({ error: "Trip not found or unauthorized." }, { status: 404 });
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
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Sign in to update a trip." }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  const body = tripUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid trip update parameters." }, { status: 400 });

  try {
    const trip = await prisma.trip.findFirst({ where: { id: params.id, userId: user.id } });
    if (!trip) return NextResponse.json({ error: "Trip not found." }, { status: 404 });
    const itinerary = (trip.itinerary as Record<string, unknown>) || {};
    const updatedItinerary = {
      ...itinerary,
      ...(body.data.packingList !== undefined ? { packingList: body.data.packingList } : {}),
      ...(body.data.journalEntries !== undefined ? { journalEntries: body.data.journalEntries } : {}),
      ...(body.data.diary !== undefined ? { diary: body.data.diary } : {}),
    };

    const updatedTrip = await prisma.trip.update({
      where: { id: trip.id },
      data: { itinerary: updatedItinerary }
    });
    return NextResponse.json({ trip: updatedTrip });
  } catch (error) {
    console.error("Trip update failed", error);
    return NextResponse.json({ error: "Could not save your trip updates." }, { status: 500 });
  }
}
