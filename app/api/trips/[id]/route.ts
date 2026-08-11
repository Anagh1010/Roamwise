import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase";
import { packingListSchema } from "@/lib/planner";

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

const packingListUpdateSchema = z.object({ packingList: packingListSchema });

export async function PATCH(request: Request, { params }: RouteContext) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Sign in to update a trip." }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  const body = packingListUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "The packing list is invalid." }, { status: 400 });

  try {
    const trip = await prisma.trip.findFirst({ where: { id: params.id, userId: user.id } });
    if (!trip) return NextResponse.json({ error: "Trip not found." }, { status: 404 });
    const itinerary = trip.itinerary as Record<string, unknown>;
    const updatedTrip = await prisma.trip.update({
      where: { id: trip.id },
      data: { itinerary: { ...itinerary, packingList: body.data.packingList } }
    });
    return NextResponse.json({ trip: updatedTrip });
  } catch (error) {
    console.error("Packing list update failed", error);
    return NextResponse.json({ error: "Could not save your packing list." }, { status: 500 });
  }
}
