import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateTravelDiary } from "@/lib/planner";
import { getAuthenticatedUser } from "@/lib/supabase";
import type { Itinerary } from "@/lib/types";

type RouteContext = { params: { id: string } };

export async function POST(request: Request, { params }: RouteContext) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Sign in to generate a travel diary." }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database not configured." }, { status: 503 });

  try {
    const trip = await prisma.trip.findFirst({ where: { id: params.id, userId: user.id } });
    if (!trip) return NextResponse.json({ error: "Trip not found." }, { status: 404 });

    const itinerary = trip.itinerary as unknown as Itinerary;
    const diary = await generateTravelDiary({
      destination: trip.destination,
      totalBudget: trip.budget,
      currency: itinerary.currency || "USD",
      itinerary,
      entries: itinerary.journalEntries || [],
    });

    const updatedTrip = await prisma.trip.update({
      where: { id: trip.id },
      data: { itinerary: { ...itinerary, diary } as Prisma.InputJsonValue }
    });

    return NextResponse.json({ diary, trip: updatedTrip });
  } catch (error) {
    console.error("AI Travel Diary generation failed", error);
    return NextResponse.json({ error: "Could not generate your travel diary." }, { status: 500 });
  }
}
