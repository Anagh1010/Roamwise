import { NextResponse } from "next/server";
import { z } from "zod";
import { buildItinerary } from "@/lib/planner";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getAuthenticatedUser } from "@/lib/supabase";

const requestSchema = z.object({
  destination: z.string().min(2).max(100),
  startDate: z.string().date(),
  endDate: z.string().date(),
  budget: z.number().int().min(10).max(10_000_000),
  currency: z.string().optional().default("USD"),
  includeBriefing: z.boolean().optional().default(true),
  pace: z.enum(["Slow", "Balanced", "Fast"]),
  interests: z.array(z.string()).max(8),
  accessibility: z.string().max(280).optional()
}).refine((data) => data.endDate >= data.startDate, { message: "Your end date must be after your start date.", path: ["endDate"] });

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const user = await getAuthenticatedUser(request);
  
  // Rate limit: 30 requests/10 min for authenticated users, 10 requests/10 min for anonymous IPs
  const limitKey = user ? `itinerary:user:${user.id}` : `itinerary:ip:${ip}`;
  const maxRequests = user ? 30 : 10;
  const rateLimit = checkRateLimit(limitKey, maxRequests, 10 * 60 * 1000);

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: `Too many itinerary requests. Please try again in ${rateLimit.retryAfterSeconds} seconds.` },
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

  const json = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid trip details" }, { status: 400 });

  try {
    const result = await buildItinerary(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Itinerary request failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "The AI itinerary could not be completed. Please try again." }, { status: 502 });
  }
}

