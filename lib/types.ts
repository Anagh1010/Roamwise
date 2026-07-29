export type PlannerInput = {
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
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
  days: DayPlan[];
  totalEstimatedCost: number;
  packingTips: string[];
};
