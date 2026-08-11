export type PlannerInput = {
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  currency?: string;
  includeBriefing?: boolean;
  pace: "Slow" | "Balanced" | "Fast";
  interests: string[];
  accessibility?: string;
};

export type Activity = {
  time: string;
  title: string;
  place: string;
  description: string;
  kind: "stay" | "food" | "explore" | "move";
  cost: number;
  duration: string;
};

export type DayPlan = {
  day: number;
  date: string;
  theme: string;
  activities: Activity[];
};

export type TravelBriefing = {
  language?: string;
  locale?: string;
  generatedAt?: string;
  source?: "ai" | "demo";
  culturalEtiquette: string[];
  localCustoms: string[];
  usefulPhrases: { phrase: string; translation: string; pronunciation?: string }[];
  safetyAdvice: string[];
};

export const packingCategories = ["Documents & essentials", "Clothing", "Toiletries & health", "Tech", "Activity-specific", "Optional"] as const;
export type PackingCategory = (typeof packingCategories)[number];

export type PackingItem = {
  category: PackingCategory;
  item: string;
  essential: boolean;
  checked?: boolean;
};

export type Itinerary = {
  title: string;
  overview: string;
  currency?: string;
  days: DayPlan[];
  totalEstimatedCost: number;
  packingTips: string[];
  packingList: PackingItem[];
  briefing?: TravelBriefing;
};
