import type { Itinerary, PlannerInput } from "./types";
import { formatCurrency } from "./currency";

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric" }).format(date);

export function createDemoItinerary(input: PlannerInput): Itinerary {
  const currency = input.currency || "USD";
  const start = new Date(`${input.startDate}T12:00:00`);
  const end = new Date(`${input.endDate}T12:00:00`);
  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1);
  const dailyBudget = Math.max(45, Math.floor(input.budget / days));
  const leadInterest = input.interests[0] || "local culture";
  const light = input.pace === "Slow";
  const full = input.pace === "Fast";
  const formattedBudget = formatCurrency(input.budget, currency);

  const sampleEntries: import("./types").JournalEntry[] = [
    {
      id: "demo-entry-1",
      dayNumber: 1,
      date: formatDate(start),
      time: "14:30",
      type: "memory",
      title: `First impressions of ${input.destination}`,
      content: `Checked into our hotel and stepped outside into the afternoon sun. The atmosphere here is incredible!`,
      location: `${input.destination} City Centre`,
      mood: "🤩 Excited",
      createdAt: new Date(start).toISOString(),
    },
    {
      id: "demo-entry-2",
      dayNumber: 1,
      date: formatDate(start),
      time: "19:45",
      type: "expense",
      title: "Welcome dinner & drinks",
      content: "Sampled regional specialties and local wine at a cozy bistro.",
      expense: {
        amount: Math.round(dailyBudget * 0.35),
        category: "food",
        description: "Welcome dinner for two",
      },
      location: "Neighbourhood Bistro",
      createdAt: new Date(start).toISOString(),
    },
    {
      id: "demo-entry-3",
      dayNumber: 2,
      date: formatDate(new Date(start.getTime() + 86400000)),
      time: "10:15",
      type: "note",
      title: "Morning coffee & pastry stop",
      content: "Found a tiny bakery recommended by locals. Best espresso of the trip so far.",
      location: "Artisanal Bakery",
      mood: "☕ Relaxed",
      createdAt: new Date(start.getTime() + 86400000).toISOString(),
    },
  ];

  const itinerary: Itinerary = {
    title: `${days}-day ${input.destination} escape`,
    overview: `A ${input.pace.toLowerCase()} itinerary shaped around ${input.interests.join(", ") || "your curiosities"}, with room to wander and stay within your ${formattedBudget} budget.`,
    currency,
    totalEstimatedCost: Math.min(input.budget, dailyBudget * days),
    packingTips: ["Comfortable walking shoes", "A reusable water bottle", "One layer for changing evenings"],
    packingList: [
      { category: "Documents & essentials", item: "Passport or government ID", essential: true },
      { category: "Documents & essentials", item: "Travel insurance details", essential: true },
      { category: "Documents & essentials", item: "Payment card and a small amount of local cash", essential: true },
      { category: "Clothing", item: "Comfortable walking shoes", essential: true },
      { category: "Clothing", item: "Versatile layers for changing temperatures", essential: true },
      { category: "Clothing", item: input.interests.includes("Nightlife") ? "A smart evening outfit" : "A comfortable day outfit", essential: false },
      { category: "Toiletries & health", item: "Prescription medication in original packaging", essential: true },
      { category: "Toiletries & health", item: "Sunscreen and reusable water bottle", essential: true },
      { category: "Toiletries & health", item: "Small first-aid kit", essential: false },
      { category: "Tech", item: "Phone charger and power bank", essential: true },
      { category: "Tech", item: "Destination plug adapter", essential: true },
      { category: "Activity-specific", item: input.interests.includes("Nature") ? "Light rain layer and daypack" : "Compact day bag", essential: false },
      { category: "Activity-specific", item: input.interests.includes("Food & drink") ? "Reusable tote for market finds" : "Refillable water bottle", essential: false },
      { category: "Optional", item: "Paperback, e-reader, or journal", essential: false },
      { category: "Optional", item: "Laundry pouch", essential: false },
    ],
    briefing: {
      language: "Local language",
      locale: "Check destination-specific guidance",
      source: "demo",
      generatedAt: new Date().toISOString(),
      culturalEtiquette: [
        "Greet locals with a smile and a polite hello in the local language",
        "Dress modestly when visiting religious sites — cover shoulders and knees",
        "Ask before photographing people or sacred places",
        "Keep your voice down in residential neighbourhoods, especially in the evenings",
        "Avoid public displays of affection in conservative areas",
      ],
      localCustoms: [
        "Tipping 10–15% is appreciated at sit-down restaurants; less expected at cafés",
        "Mealtimes tend to run later than you might be used to — plan accordingly",
        "Locals often greet with two cheek kisses; follow their lead",
        "Shops may close for a few hours in the early afternoon",
        "Haggling is common in markets; in shops, prices are usually fixed",
      ],
      usefulPhrases: [
        { phrase: "Hello", translation: "A warm local greeting", pronunciation: "Check a phrasebook for the local script" },
        { phrase: "Thank you", translation: "Express gratitude", pronunciation: "Locals always appreciate the effort" },
        { phrase: "Please", translation: "Polite request", pronunciation: "Goes a long way with service staff" },
        { phrase: "Where is…?", translation: "Ask for directions", pronunciation: "Point to a map if unsure" },
        { phrase: "How much?", translation: "Ask for a price", pronunciation: "Useful in markets" },
        { phrase: "Do you speak English?", translation: "Find a helpful local", pronunciation: "" },
        { phrase: "I'd like this, please", translation: "Order or purchase", pronunciation: "Pair with pointing" },
        { phrase: "Excuse me", translation: "Get attention politely", pronunciation: "" },
      ],
      safetyAdvice: [
        "Keep a digital and physical copy of your passport and travel insurance",
        "Use hotel safes for valuables and avoid displaying expensive items in crowds",
        "Stick to well-lit, busy streets at night and share your location with someone you trust",
        "Only use licensed taxis or reputable ride-hailing apps — agree on the fare first",
        "Stay hydrated and apply sunscreen, especially in warm or high-altitude destinations",
        "Check your government's travel advisories before departure for up-to-date safety notes",
      ],
    },
    days: Array.from({ length: days }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const isFirst = index === 0;
      const isLast = index === days - 1;
      return {
        day: index + 1,
        date: formatDate(date),
        theme: isFirst ? "Settle in & get oriented" : isLast ? "One last local moment" : `${leadInterest} & hidden corners`,
        activities: [
          {
            time: isFirst ? "10:00" : "09:00",
            title: isFirst ? `Arrive in ${input.destination}` : "Unhurried neighborhood walk",
            place: isFirst ? "Central arrival point" : "A walkable local district",
            description: isFirst ? "Drop bags, collect a transit pass, and get your bearings." : `Start gently with coffee and a self-guided look at the city's everyday rhythm.`,
            kind: "move",
            cost: 10,
            duration: "1 hr"
          },
          {
            time: light ? "12:30" : "11:30",
            title: `A taste of ${leadInterest}`,
            place: "Local favourite",
            description: `Choose a well-reviewed, easy-to-reach spot for a memorable ${leadInterest} experience.`,
            kind: "explore",
            cost: Math.round(dailyBudget * 0.28),
            duration: full ? "2 hrs" : "3 hrs"
          },
          {
            time: "15:30",
            title: isLast ? "Pick up a small souvenir" : "Free time to follow a spark",
            place: "Independent shops & side streets",
            description: isLast ? "Leave room for a final coffee and any gifts you have your eye on." : "Keep this block open: browse, rest, or add a spontaneous recommendation.",
            kind: "explore",
            cost: Math.round(dailyBudget * 0.12),
            duration: light ? "2.5 hrs" : "1.5 hrs"
          },
          {
            time: "19:00",
            title: "Dinner with a local feel",
            place: "Neighbourhood restaurant",
            description: "Book ahead if it is a weekend, then take a relaxed evening stroll nearby.",
            kind: "food",
            cost: Math.round(dailyBudget * 0.3),
            duration: "2 hrs"
          }
        ]
      };
    })
  };
  itinerary.journalEntries = sampleEntries;
  itinerary.diary = createDemoTravelDiary({ destination: input.destination, itinerary, entries: sampleEntries });
  if (input.includeBriefing === false) delete itinerary.briefing;
  return itinerary;
}

export function createDemoTravelDiary(input: {
  destination: string;
  startDate?: string;
  endDate?: string;
  currency?: string;
  itinerary: Itinerary;
  entries?: import("./types").JournalEntry[];
}): import("./types").TravelDiary {
  const currency = input.currency || input.itinerary.currency || "USD";
  const entries = input.entries || input.itinerary.journalEntries || [];
  const totalSpent = entries.reduce((sum, e) => sum + (e.expense?.amount || 0), 0);

  const notesList = entries.filter((e) => e.type === "note" || e.type === "memory");
  const notesExcerpt = notesList.length > 0
    ? `Notable moments recorded along the way included ${notesList.map((n) => `"${n.title}" (${n.content || "a memorable snapshot"})`).slice(0, 3).join(", ")}.`
    : `Explored hidden side streets, local bakeries, and unforgettable neighborhood vibes.`;

  const highlights = notesList.length > 0
    ? notesList.slice(0, 4).map((n) => n.title)
    : [
        `Arrival and first impressions of ${input.destination}`,
        `Authentic local food and evening strolls`,
        `Unhurried morning coffee and neighborhood architecture`,
        `Serendipitous detour through historic backstreets`,
      ];

  return {
    title: `Memoirs of ${input.destination}: An Unhurried Journey`,
    summary: `A heartfelt record of wandering through ${input.destination}, savoring unforgettable meals, tracking discoveries, and embracing the beauty of unexpected moments.`,
    prose: `Stepping into ${input.destination} brought an immediate change of pace. From the moment of arrival, the days unfolded with a rare balance of wonder and ease. ${notesExcerpt}\n\nEach day carried its own distinct atmosphere—from quiet morning walks where the city slowly stirred to life, to evening dinners surrounded by the warm hum of local conversation. The planned route provided the canvas, but the genuine magic lived in the unplanned detours: catching the golden light reflecting off historic facades, sitting at a sunlit terrace café, and embracing every small discovery.\n\nLooking back across the days, ${input.destination} offered far more than just a destination; it offered a reminder to wander deeply, pack lightly, and cherish the rhythm of being present in a new place.`,
    highlights,
    totalSpent: totalSpent > 0 ? totalSpent : undefined,
    reflection: `Traveling through ${input.destination} wasn't about checking boxes—it was about savoring the spaces in between. The memories and notes collected here capture a journey that felt truly personal.`,
    generatedAt: new Date().toISOString(),
    source: "demo",
  };
}
