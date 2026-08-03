import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase";

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
