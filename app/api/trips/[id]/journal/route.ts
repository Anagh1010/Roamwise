import { NextResponse } from "next/server";
import { z } from "zod";
import { concurrentTripUpdateResponse, getOwnedTrip, invalidPersistedItineraryResponse, parsePersistedItinerary, updateItineraryIfCurrent } from "@/lib/api/trips";
import { journalEntrySchema } from "@/lib/schemas/itinerary";
import type { Trip } from "@prisma/client";
import type { PersistedItinerary } from "@/lib/schemas/itinerary";

type RouteContext = { params: Promise<{ id: string }> };

const entryInputSchema = z.object({
  dayNumber: z.number().int().positive().optional(), date: z.string().min(1).max(40).optional(), time: z.string().max(40).optional(),
  type: z.enum(["note", "expense", "memory"]).optional(), title: z.string().min(1).max(200), content: z.string().max(5_000).optional(),
  expense: z.object({ amount: z.number().finite().positive(), category: z.enum(["food", "transport", "activity", "stay", "shopping", "other"]), description: z.string().min(1).max(500) }).optional(),
  location: z.string().max(300).optional(), mood: z.string().max(100).optional(), imageUrl: z.string().url().max(2_048).optional(),
});
const entryUpdateSchema = entryInputSchema.partial({ title: true }).refine((value) => Object.keys(value).length > 0);

type ValidatedTripResult = { trip: Trip; itinerary: PersistedItinerary } | { error: NextResponse };

async function getValidatedTrip(request: Request, id: string, action: string): Promise<ValidatedTripResult> {
  const result = await getOwnedTrip(request, id, action);
  if ("error" in result && result.error) return { error: result.error };
  const itinerary = parsePersistedItinerary(result.trip);
  return itinerary.success ? { trip: result.trip, itinerary: itinerary.data } : { error: invalidPersistedItineraryResponse() };
}

export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const body = entryInputSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid journal entry." }, { status: 400 });
  try {
    const result = await getValidatedTrip(request, id, "add journal entries");
    if ("error" in result) return result.error;
    const now = new Date();
    const entry = journalEntrySchema.parse({ ...body.data, id: crypto.randomUUID(), date: body.data.date ?? now.toISOString().slice(0, 10), time: body.data.time ?? now.toISOString().slice(11, 16), type: body.data.type ?? "note", content: body.data.content ?? "", createdAt: now.toISOString() });
    const saved = await updateItineraryIfCurrent(result.trip, { ...result.itinerary, journalEntries: [entry, ...result.itinerary.journalEntries] });
    if (!saved) return concurrentTripUpdateResponse();
    return NextResponse.json({ entry });
  } catch (error) {
    console.error("Journal entry creation failed", error);
    return NextResponse.json({ error: "Could not save your journal entry." }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const body = z.object({ entryId: z.string().uuid(), entry: entryUpdateSchema }).safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid journal entry update." }, { status: 400 });
  try {
    const result = await getValidatedTrip(request, id, "update journal entries");
    if ("error" in result) return result.error;
    const index = result.itinerary.journalEntries.findIndex((entry) => entry.id === body.data.entryId);
    if (index < 0) return NextResponse.json({ error: "Journal entry not found." }, { status: 404 });
    const entry = journalEntrySchema.parse({ ...result.itinerary.journalEntries[index], ...body.data.entry });
    const journalEntries = [...result.itinerary.journalEntries]; journalEntries[index] = entry;
    if (!await updateItineraryIfCurrent(result.trip, { ...result.itinerary, journalEntries })) return concurrentTripUpdateResponse();
    return NextResponse.json({ entry });
  } catch (error) {
    console.error("Journal entry update failed", error);
    return NextResponse.json({ error: "Could not update this journal entry." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const entryId = new URL(request.url).searchParams.get("entryId");
  if (!entryId || !z.string().uuid().safeParse(entryId).success) return NextResponse.json({ error: "A valid entryId is required." }, { status: 400 });
  try {
    const result = await getValidatedTrip(request, id, "delete journal entries");
    if ("error" in result) return result.error;
    const journalEntries = result.itinerary.journalEntries.filter((entry) => entry.id !== entryId);
    if (journalEntries.length === result.itinerary.journalEntries.length) return NextResponse.json({ error: "Journal entry not found." }, { status: 404 });
    if (!await updateItineraryIfCurrent(result.trip, { ...result.itinerary, journalEntries })) return concurrentTripUpdateResponse();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Journal entry deletion failed", error);
    return NextResponse.json({ error: "Could not delete this journal entry." }, { status: 500 });
  }
}
