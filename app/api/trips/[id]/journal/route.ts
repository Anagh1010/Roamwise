import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase";
import type { JournalEntry } from "@/lib/types";
import { journalEntrySchema } from "@/lib/planner";
import { z } from "zod";

type RouteContext = { params: { id: string } };

export async function POST(request: Request, { params }: RouteContext) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Sign in to add journal entries." }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database not configured." }, { status: 503 });

  try {
    const body = await request.json().catch(() => null);
    if (!body || !body.title) return NextResponse.json({ error: "A journal entry title is required." }, { status: 400 });

    const trip = await prisma.trip.findFirst({ where: { id: params.id, userId: user.id } });
    if (!trip) return NextResponse.json({ error: "Trip not found." }, { status: 404 });

    const itinerary = (trip.itinerary as Record<string, unknown>) || {};
    const existingEntries = (itinerary.journalEntries as JournalEntry[]) || [];

    const candidate = {
      id: body.id || `entry-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      dayNumber: body.dayNumber,
      date: body.date || new Date().toISOString().slice(0, 10),
      time: body.time || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type: body.type || "note",
      title: body.title,
      content: body.content || "",
      expense: body.expense,
      location: body.location,
      mood: body.mood,
      imageUrl: body.imageUrl,
      createdAt: body.createdAt || new Date().toISOString(),
    };
    const parsed = journalEntrySchema.safeParse(candidate);
    if (!parsed.success) return NextResponse.json({ error: "Invalid journal entry." }, { status: 400 });
    const newEntry: JournalEntry = parsed.data;

    const updatedEntries = [newEntry, ...existingEntries];
    const updatedTrip = await prisma.trip.update({
      where: { id: trip.id },
      data: { itinerary: { ...itinerary, journalEntries: updatedEntries } }
    });

    return NextResponse.json({ entry: newEntry, trip: updatedTrip });
  } catch (error) {
    console.error("Journal entry creation failed", error);
    return NextResponse.json({ error: "Could not save your journal entry." }, { status: 500 });
  }
}

const journalEntryUpdateSchema = z.object({
  dayNumber: z.number().int().positive().optional(),
  date: z.string().min(1).max(40).optional(),
  time: z.string().max(40).optional(),
  type: z.enum(["note", "expense", "memory"]).optional(),
  title: z.string().min(1).max(200).optional(),
  content: z.string().max(5000).optional(),
  expense: z.object({
    amount: z.number().finite().positive(),
    category: z.enum(["food", "transport", "activity", "stay", "shopping", "other"]),
    description: z.string().min(1).max(500),
  }).optional(),
  location: z.string().max(300).optional(),
  mood: z.string().max(100).optional(),
  imageUrl: z.string().url().max(2048).optional(),
});

export async function PATCH(request: Request, { params }: RouteContext) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Sign in to update journal entries." }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database not configured." }, { status: 503 });

  const body = z.object({ entryId: z.string().min(1), entry: journalEntryUpdateSchema }).safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid journal entry update." }, { status: 400 });

  try {
    const trip = await prisma.trip.findFirst({ where: { id: params.id, userId: user.id } });
    if (!trip) return NextResponse.json({ error: "Trip not found." }, { status: 404 });
    const itinerary = (trip.itinerary as Record<string, unknown>) || {};
    const entries = (itinerary.journalEntries as JournalEntry[]) || [];
    const index = entries.findIndex((entry) => entry.id === body.data.entryId);
    if (index < 0) return NextResponse.json({ error: "Journal entry not found." }, { status: 404 });
    const entry = { ...entries[index], ...body.data.entry };
    const validEntry = journalEntrySchema.safeParse(entry);
    if (!validEntry.success) return NextResponse.json({ error: "Invalid journal entry update." }, { status: 400 });
    const updatedEntries = [...entries]; updatedEntries[index] = validEntry.data;
    const updatedTrip = await prisma.trip.update({ where: { id: trip.id }, data: { itinerary: { ...itinerary, journalEntries: updatedEntries } } });
    return NextResponse.json({ entry: validEntry.data, trip: updatedTrip });
  } catch (error) {
    console.error("Journal entry update failed", error);
    return NextResponse.json({ error: "Could not update this journal entry." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Sign in to delete journal entries." }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database not configured." }, { status: 503 });

  try {
    const { searchParams } = new URL(request.url);
    const body = await request.json().catch(() => null);
    const entryId = searchParams.get("entryId") || body?.entryId;

    if (!entryId) return NextResponse.json({ error: "entryId is required." }, { status: 400 });

    const trip = await prisma.trip.findFirst({ where: { id: params.id, userId: user.id } });
    if (!trip) return NextResponse.json({ error: "Trip not found." }, { status: 404 });

    const itinerary = (trip.itinerary as Record<string, unknown>) || {};
    const existingEntries = (itinerary.journalEntries as JournalEntry[]) || [];
    const updatedEntries = existingEntries.filter((e) => e.id !== entryId);

    const updatedTrip = await prisma.trip.update({
      where: { id: trip.id },
      data: { itinerary: { ...itinerary, journalEntries: updatedEntries } }
    });

    return NextResponse.json({ success: true, trip: updatedTrip });
  } catch (error) {
    console.error("Journal entry deletion failed", error);
    return NextResponse.json({ error: "Could not delete this journal entry." }, { status: 500 });
  }
}
