import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase";

const activitySchema = z.object({ time: z.string(), title: z.string(), place: z.string(), description: z.string(), kind: z.string(), cost: z.number(), duration: z.string() });
const itinerarySchema = z.object({ title: z.string(), overview: z.string(), totalEstimatedCost: z.number(), packingTips: z.array(z.string()), days: z.array(z.object({ day: z.number(), date: z.string(), theme: z.string(), activities: z.array(activitySchema) })) });
const tripSchema = z.object({ destination: z.string().min(2), startDate: z.string().date(), endDate: z.string().date(), budget: z.number().int(), pace: z.string(), interests: z.array(z.string()), accessibility: z.string().optional(), itinerary: itinerarySchema });

export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Sign in to save trips." }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Add DATABASE_URL to save trips." }, { status: 503 });
  const data = tripSchema.safeParse(await request.json().catch(() => null));
  if (!data.success) return NextResponse.json({ error: "This itinerary is incomplete." }, { status: 400 });
  try {
    const trip = await prisma.trip.create({ data: { ...data.data, userId: user.id, startDate: new Date(data.data.startDate), endDate: new Date(data.data.endDate) } });
    return NextResponse.json({ id: trip.id });
  } catch (error) {
    console.error("Trip save failed", error);
    return NextResponse.json({ error: "Could not save this trip. Check your database connection." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Sign in to view saved trips." }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Add DATABASE_URL to view saved trips." }, { status: 503 });
  try {
    const trips = await prisma.trip.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" }, take: 20 });
    return NextResponse.json({ trips });
  } catch (error) {
    console.error("Trip library load failed", error);
    return NextResponse.json({ error: "Could not load your trips. Check your database connection." }, { status: 500 });
  }
}
