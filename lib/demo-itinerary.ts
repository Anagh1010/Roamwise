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

  return {
    title: `${days}-day ${input.destination} escape`,
    overview: `A ${input.pace.toLowerCase()} itinerary shaped around ${input.interests.join(", ") || "your curiosities"}, with room to wander and stay within your ${formattedBudget} budget.`,
    currency,
    totalEstimatedCost: Math.min(input.budget, dailyBudget * days),
    packingTips: ["Comfortable walking shoes", "A reusable water bottle", "One layer for changing evenings"],
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
}
