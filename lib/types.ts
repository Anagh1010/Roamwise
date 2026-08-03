export type PlannerInput = {
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  currency?: string;
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

export type Itinerary = {
  title: string;
  overview: string;
  currency?: string;
  days: DayPlan[];
  totalEstimatedCost: number;
  packingTips: string[];
};

