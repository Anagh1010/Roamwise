import { NextResponse } from "next/server";
import { findPlace } from "@/lib/places";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`places:ip:${ip}`, 30, 60 * 1000); // 30 req/min

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Too many place search requests. Please slow down." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
          "X-RateLimit-Limit": String(rateLimit.limit),
          "X-RateLimit-Remaining": String(rateLimit.remaining),
        },
      }
    );
  }

  const query = new URL(request.url).searchParams.get("query")?.trim();
  if (!query) return NextResponse.json({ error: "A place query is required." }, { status: 400 });
  if (query.length > 120) return NextResponse.json({ error: "Place query is too long." }, { status: 400 });

  const place = await findPlace(query);
  return NextResponse.json({ place });
}

