import { NextResponse } from "next/server";
import { z } from "zod";
import { answerBriefingQuestion, itinerarySchema } from "@/lib/planner";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase";

type RouteContext = { params: { id: string } };
const bodySchema = z.object({ question: z.string().trim().min(3).max(300) });

export async function POST(request: Request, { params }: RouteContext) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Sign in to ask travel briefing questions." }, { status: 401 });
  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Ask a short travel briefing question." }, { status: 400 });
  if (!process.env.DATABASE_URL || !process.env.GEMINI_API_KEY) return NextResponse.json({ error: "A database connection and GEMINI_API_KEY are required." }, { status: 503 });
  try {
    const trip = await prisma.trip.findFirst({ where: { id: params.id, userId: user.id } });
    if (!trip) return NextResponse.json({ error: "Trip not found." }, { status: 404 });
    const itinerary = itinerarySchema.safeParse(trip.itinerary);
    if (!itinerary.success || !itinerary.data.briefing) return NextResponse.json({ error: "Generate a travel briefing first." }, { status: 422 });
    return NextResponse.json({ answer: await answerBriefingQuestion({ destination: trip.destination, itinerary: itinerary.data, question: body.data.question }) });
  } catch (error) {
    console.error("Travel briefing question failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not answer this question." }, { status: 502 });
  }
}
