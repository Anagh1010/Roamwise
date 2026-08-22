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

export const expenseCategories = ["food", "transport", "activity", "stay", "shopping", "other"] as const;
export type ExpenseCategory = (typeof expenseCategories)[number];

export type JournalEntryType = "note" | "expense" | "memory";

export type JournalExpense = {
  amount: number;
  category: ExpenseCategory;
  description: string;
};

export type JournalEntry = {
  id: string;
  dayNumber?: number;
  date: string;
  time?: string;
  type: JournalEntryType;
  title: string;
  content: string;
  expense?: JournalExpense;
  location?: string;
  mood?: string;
  imageUrl?: string;
  createdAt: string;
};

export type TravelDiary = {
  title: string;
  summary: string;
  prose: string;
  highlights: string[];
  totalSpent?: number;
  reflection: string;
  generatedAt: string;
  source?: "ai" | "demo";
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
  journalEntries?: JournalEntry[];
  diary?: TravelDiary;
};
