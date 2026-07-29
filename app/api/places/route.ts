import { NextResponse } from "next/server";
import { findPlace } from "@/lib/places";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("query")?.trim();
  if (!query) return NextResponse.json({ error: "A place query is required." }, { status: 400 });
  const place = await findPlace(query);
  return NextResponse.json({ place });
}
