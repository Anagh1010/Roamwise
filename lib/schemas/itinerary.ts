import { z } from "zod";
import { expenseCategories, packingCategories } from "@/lib/types";

const usefulPhraseSchema = z.object({
  phrase: z.string(),
  translation: z.string(),
  pronunciation: z.string().optional(),
});

export const briefingSchema = z.object({
  language: z.string().min(1).max(80).optional(),
  locale: z.string().min(2).max(20).optional(),
  generatedAt: z.string().datetime().optional(),
  source: z.enum(["ai", "demo"]).optional(),
  culturalEtiquette: z.array(z.string()).min(2).max(8),
  localCustoms: z.array(z.string()).min(2).max(8),
  usefulPhrases: z.array(usefulPhraseSchema).min(4).max(12),
  safetyAdvice: z.array(z.string()).min(2).max(8),
});

export const journalEntrySchema = z.object({
  id: z.string().min(1).max(120),
  dayNumber: z.number().int().positive().optional(),
  date: z.string().min(1).max(40),
  time: z.string().max(40).optional(),
  type: z.enum(["note", "expense", "memory"]),
  title: z.string().min(1).max(200),
  content: z.string().max(5000),
  expense: z.object({
    amount: z.number().finite().positive(),
    category: z.enum(expenseCategories),
    description: z.string().min(1).max(500),
  }).optional(),
  location: z.string().max(300).optional(),
  mood: z.string().max(100).optional(),
  imageUrl: z.string().url().max(2048).optional(),
  createdAt: z.string().datetime(),
}).superRefine((entry, ctx) => {
  if (entry.type === "expense" && !entry.expense) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Expenses require an amount and category.", path: ["expense"] });
  }
});

export const travelDiarySchema = z.object({
  title: z.string().min(1).max(240),
  summary: z.string().min(1).max(2_000),
  prose: z.string().min(1).max(20_000),
  highlights: z.array(z.string().min(1).max(500)).max(12),
  totalSpent: z.number().finite().nonnegative().optional(),
  reflection: z.string().min(1).max(4_000),
  generatedAt: z.string().datetime().optional(),
  source: z.enum(["ai", "demo"]).optional(),
});

const itineraryCoreSchema = z.object({
  title: z.string().min(1).max(240),
  overview: z.string().min(1).max(5_000),
  currency: z.string().min(1).max(12).default("USD"),
  totalEstimatedCost: z.number().finite().nonnegative(),
  packingTips: z.array(z.string().min(1).max(500)).max(48),
  packingList: z.array(z.object({
    category: z.enum(packingCategories),
    item: z.string().min(1).max(120),
    essential: z.boolean(),
    checked: z.boolean().optional().default(false),
  })).max(48).default([]),
  briefing: briefingSchema.optional(),
  days: z.array(z.object({
    day: z.number().int().positive(),
    date: z.string().min(1).max(40),
    theme: z.string().min(1).max(500),
    activities: z.array(z.object({
      time: z.string().min(1).max(80),
      title: z.string().min(1).max(300),
      place: z.string().min(1).max(300),
      description: z.string().min(1).max(3_000),
      kind: z.enum(["stay", "food", "explore", "move"]),
      cost: z.number().finite().nonnegative(),
      duration: z.string().min(1).max(120),
    })).max(32),
  })).min(1).max(90),
});

// The provider only creates this core shape. The database only stores the versioned shape.
export const itinerarySchema = itineraryCoreSchema;
export const persistedItinerarySchema = itineraryCoreSchema.extend({
  schemaVersion: z.literal(1).default(1),
  journalEntries: z.array(journalEntrySchema).max(1_000).default([]),
  diary: travelDiarySchema.optional(),
});

export const packingListSchema = itineraryCoreSchema.shape.packingList;
export type PersistedItinerary = z.infer<typeof persistedItinerarySchema>;
