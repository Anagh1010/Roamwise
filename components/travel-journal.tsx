"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, Calendar, Camera, DollarSign, Image as ImageIcon, LoaderCircle, MapPin, Plus, Sparkles, Trash2, Wallet } from "lucide-react";
import type { ExpenseCategory, JournalEntry, JournalEntryType, TravelDiary } from "@/lib/types";
import { expenseCategories } from "@/lib/types";
import { formatCurrency } from "@/lib/currency";
import { getSupabaseClient } from "@/lib/supabase";

type TravelJournalProps = {
  tripId?: string;
  destination: string;
  startDate?: string;
  endDate?: string;
  budget: number;
  currency?: string;
  initialEntries?: JournalEntry[];
  initialDiary?: TravelDiary;
  onEntriesChange?: (entries: JournalEntry[]) => void;
  onDiaryChange?: (diary: TravelDiary) => void;
};

const moods = ["☕ Relaxed", "🤩 Excited", "😋 Foodie bliss", "🌅 Peaceful", "🧭 Adventurous", "😴 Tired but happy"];

export function TravelJournal({
  tripId,
  destination,
  startDate,
  endDate,
  budget,
  currency = "USD",
  initialEntries = [],
  initialDiary,
  onEntriesChange,
  onDiaryChange,
}: TravelJournalProps) {
  const [activeTab, setActiveTab] = useState<"feed" | "expenses" | "diary">("feed");
  const [feedDay, setFeedDay] = useState<"all" | number>("all");
  const [entries, setEntries] = useState<JournalEntry[]>(initialEntries);
  const [diary, setDiary] = useState<TravelDiary | undefined>(initialDiary);

  // Form state
  const [entryType, setEntryType] = useState<JournalEntryType>("note");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [location, setLocation] = useState("");
  const [mood, setMood] = useState(moods[0]);
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>("food");
  const [expenseDesc, setExpenseDesc] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [dayNumber, setDayNumber] = useState<number | undefined>(1);
  const [saving, setSaving] = useState(false);
  const [generatingDiary, setGeneratingDiary] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => setEntries(initialEntries), [initialEntries]);
  useEffect(() => setDiary(initialDiary), [initialDiary]);

  const tripDays = useMemo(() => {
    if (!startDate || !endDate) return [];
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);
    const days: number[] = [];
    for (let date = start, number = 1; date <= end; date.setDate(date.getDate() + 1), number += 1) days.push(number);
    return days;
  }, [startDate, endDate]);

  // Calculate expense summary
  const totalSpent = entries.reduce((sum, entry) => sum + (entry.expense?.amount || 0), 0);
  const isOverBudget = totalSpent > budget;
  const progressPercent = Math.min(100, Math.round((totalSpent / (budget || 1)) * 100));

  const categoryTotals = expenseCategories.reduce((acc, cat) => {
    acc[cat] = entries
      .filter((e) => e.expense?.category === cat)
      .reduce((sum, e) => sum + (e.expense?.amount || 0), 0);
    return acc;
  }, {} as Record<ExpenseCategory, number>);
  const visibleEntries = feedDay === "all" ? entries : entries.filter((entry) => entry.dayNumber === feedDay);

  async function handleAddEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    setError("");

    const newEntry: JournalEntry = {
      id: `entry-${Date.now()}`,
      dayNumber: dayNumber || 1,
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type: entryType,
      title: title.trim(),
      content: content.trim(),
      location: location.trim() || undefined,
      mood: entryType === "memory" ? mood : undefined,
      imageUrl: imageUrl.trim() || undefined,
      expense:
        entryType === "expense" && parseFloat(expenseAmount) > 0
          ? {
              amount: parseFloat(expenseAmount),
              category: expenseCategory,
              description: expenseDesc.trim() || title.trim(),
            }
          : undefined,
      createdAt: new Date().toISOString(),
    };

    try {
      if (tripId) {
        const { data: { session } } = await getSupabaseClient().auth.getSession();
        if (!session) throw new Error("Your session has expired. Please sign in again.");
        const res = await fetch(`/api/trips/${tripId}/journal`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify(newEntry),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not save entry.");
      }

      const updated = [newEntry, ...entries];
      setEntries(updated);
      onEntriesChange?.(updated);

      // Reset form
      setTitle("");
      setContent("");
      setLocation("");
      setExpenseAmount("");
      setExpenseDesc("");
      setImageUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add entry.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteEntry(entryId: string) {
    if (!confirm("Delete this journal entry?")) return;

    try {
      if (tripId) {
        const { data: { session } } = await getSupabaseClient().auth.getSession();
        if (!session) throw new Error("Your session has expired. Please sign in again.");
        const res = await fetch(`/api/trips/${tripId}/journal?entryId=${entryId}`, {
          method: "DELETE", headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not delete entry.");
      }
      const updated = entries.filter((e) => e.id !== entryId);
      setEntries(updated);
      onEntriesChange?.(updated);
    } catch (err) {
      alert("Could not delete entry.");
    }
  }

  async function handleGenerateDiary() {
    setGeneratingDiary(true);
    setError("");

    try {
      if (tripId) {
        const { data: { session } } = await getSupabaseClient().auth.getSession();
        if (!session) throw new Error("Your session has expired. Please sign in again.");
        const res = await fetch(`/api/trips/${tripId}/journal/diary`, {
          method: "POST", headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not generate diary.");
        setDiary(data.diary);
        onDiaryChange?.(data.diary);
        return;
      }

      // Client-side fallback / preview generation
      const { createDemoTravelDiary } = await import("@/lib/demo-itinerary");
      const demoDiary = createDemoTravelDiary({
        destination,
        currency,
        itinerary: {
          title: `${destination} Trip`,
          overview: "",
          days: [],
          totalEstimatedCost: budget,
          packingTips: [],
          packingList: [],
          journalEntries: entries,
        },
        entries,
      });
      setDiary(demoDiary);
      onDiaryChange?.(demoDiary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate travel diary.");
    } finally {
      setGeneratingDiary(false);
    }
  }

  return (
    <section className="journal-container">
      <div className="journal-header">
        <div>
          <p className="eyebrow"><BookOpen size={14} /> TRAVEL LOG & JOURNAL</p>
          <h2>Journal, Expenses & AI Diary</h2>
          <p>Record notes, log live expenses, and generate an AI memoir story of your trip to {destination}.</p>
        </div>
      </div>

      <div className="journal-tabs">
        <button
          className={`journal-tab-btn ${activeTab === "feed" ? "active" : ""}`}
          onClick={() => setActiveTab("feed")}
        >
          <BookOpen size={16} /> Log & Feed ({entries.length})
        </button>
        <button
          className={`journal-tab-btn ${activeTab === "expenses" ? "active" : ""}`}
          onClick={() => setActiveTab("expenses")}
        >
          <Wallet size={16} /> Expense Tracker ({formatCurrency(totalSpent, currency)})
        </button>
        <button
          className={`journal-tab-btn ${activeTab === "diary" ? "active" : ""}`}
          onClick={() => setActiveTab("diary")}
        >
          <Sparkles size={16} /> AI Travel Diary {diary ? "✓" : ""}
        </button>
      </div>

      {activeTab === "feed" && (
        <>
          {/* Quick Add Form */}
          <form className="journal-form-card" onSubmit={handleAddEntry}>
            <div className="journal-type-selector">
              <button
                type="button"
                className={`type-chip ${entryType === "note" ? "selected" : ""}`}
                onClick={() => setEntryType("note")}
              >
                <BookOpen size={14} /> Note
              </button>
              <button
                type="button"
                className={`type-chip ${entryType === "expense" ? "selected" : ""}`}
                onClick={() => setEntryType("expense")}
              >
                <DollarSign size={14} /> Expense
              </button>
              <button
                type="button"
                className={`type-chip ${entryType === "memory" ? "selected" : ""}`}
                onClick={() => setEntryType("memory")}
              >
                <Camera size={14} /> Memory
              </button>
            </div>

            <div className="form-grid">
              <div>
                <label className="form-label">Title</label>
                <input
                  type="text"
                  className="journal-input"
                  placeholder={entryType === "expense" ? "Dinner at bistro" : "Morning coffee discovery"}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="form-label">Location (optional)</label>
                <input
                  type="text"
                  className="journal-input"
                  placeholder="e.g. City Centre, Café de Flore"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label">Trip day</label>
                <select className="journal-select" value={dayNumber || 1} onChange={(e) => setDayNumber(Number(e.target.value))}>
                  {(tripDays.length ? tripDays : [1]).map((number) => <option key={number} value={number}>Day {number}</option>)}
                </select>
              </div>

              {entryType === "expense" && (
                <>
                  <div>
                    <label className="form-label">Amount ({currency})</label>
                    <input
                      type="number"
                      step="0.01"
                      className="journal-input"
                      placeholder="0.00"
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">Category</label>
                    <select
                      className="journal-select"
                      value={expenseCategory}
                      onChange={(e) => setExpenseCategory(e.target.value as ExpenseCategory)}
                    >
                      {expenseCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {entryType === "memory" && (
                <>
                  <div>
                    <label className="form-label">Mood / Vibe</label>
                    <select className="journal-select" value={mood} onChange={(e) => setMood(e.target.value)}>
                      {moods.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Photo URL (optional)</label>
                    <input
                      type="url"
                      className="journal-input"
                      placeholder="https://..."
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="form-field-full">
                <label className="form-label">Notes & Details</label>
                <textarea
                  className="journal-textarea"
                  placeholder="Write a few lines about what happened, what you ate, or what you felt..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>
            </div>

            {error && <p className="error">{error}</p>}

            <button type="submit" className="primary small" disabled={saving}>
              {saving ? <LoaderCircle className="spin" size={16} /> : <Plus size={16} />}
              {saving ? "Saving..." : "Add to Journal"}
            </button>
          </form>

          {/* Timeline Feed */}
          {entries.length > 0 && (
            <div className="journal-feed-filter">
              <label className="form-label" htmlFor="journal-day-filter">Show</label>
              <select id="journal-day-filter" className="journal-select" value={feedDay} onChange={(e) => setFeedDay(e.target.value === "all" ? "all" : Number(e.target.value))}>
                <option value="all">All days</option>
                {(tripDays.length ? tripDays : Array.from(new Set(entries.map((entry) => entry.dayNumber).filter(Boolean) as number[]))).map((number) => <option key={number} value={number}>Day {number}</option>)}
              </select>
            </div>
          )}
          <div className="timeline-feed">
            {visibleEntries.length === 0 ? (
              <p className="empty-trips" style={{ margin: "20px 0", padding: "30px", fontSize: "14px" }}>
                {entries.length === 0 ? "No journal entries yet. Log your first note, expense, or photo memory above!" : "No entries recorded for this day yet."}
              </p>
            ) : (
              visibleEntries.map((item) => (
                <article className="timeline-entry-card" key={item.id}>
                  <div className="entry-top">
                    <span className={`entry-badge ${item.type}`}>
                      {item.type === "note" && <BookOpen size={12} />}
                      {item.type === "expense" && <DollarSign size={12} />}
                      {item.type === "memory" && <Camera size={12} />}
                      {item.type}
                    </span>
                    <button
                      type="button"
                      className="delete-trip-btn"
                      onClick={() => handleDeleteEntry(item.id)}
                      title="Delete entry"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <h3 className="entry-title">{item.title}</h3>
                  {item.content && <p className="entry-content">{item.content}</p>}

                  {item.imageUrl && (
                    <div style={{ marginBottom: "12px", borderRadius: "6px", overflow: "hidden", maxHeight: "200px" }}>
                      <img src={item.imageUrl} alt={item.title} style={{ width: "100%", objectFit: "cover" }} />
                    </div>
                  )}

                  <div className="entry-meta">
                    {item.expense && (
                      <span style={{ fontWeight: 700, color: "#34d399" }}>
                        {formatCurrency(item.expense.amount, currency)} ({item.expense.category})
                      </span>
                    )}
                    {item.location && (
                      <span>
                        <MapPin size={12} /> {item.location}
                      </span>
                    )}
                    {item.mood && <span>{item.mood}</span>}
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </article>
              ))
            )}
          </div>
        </>
      )}

      {activeTab === "expenses" && (
        <div className="expense-tracker">
          <div className="expense-stat-row">
            <div>
              <span className="form-label">TOTAL EXPENSES RECORDED</span>
              <div className="expense-total-spent">{formatCurrency(totalSpent, currency)}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <span className="form-label">TRIP BUDGET LIMIT</span>
              <div className="expense-budget-limit">{formatCurrency(budget, currency)}</div>
            </div>
          </div>

          <div className="progress-bar-bg">
            <div
              className={`progress-bar-fill ${isOverBudget ? "overbudget" : ""}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <p style={{ fontSize: "13px", color: isOverBudget ? "#ef4444" : "var(--muted)", marginBottom: "24px" }}>
            {isOverBudget
              ? `⚠️ You are ${formatCurrency(totalSpent - budget, currency)} over your budget.`
              : `You have ${formatCurrency(budget - totalSpent, currency)} remaining in your budget.`}
          </p>

          <h4 className="form-label" style={{ marginBottom: "12px" }}>
            EXPENSES BY CATEGORY
          </h4>
          <div className="category-breakdown">
            {expenseCategories.map((cat) => (
              <div className="category-card" key={cat}>
                <span className="category-card-name">{cat}</span>
                <span className="category-card-amount">{formatCurrency(categoryTotals[cat], currency)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "diary" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <p className="eyebrow" style={{ margin: 0 }}>
              <Sparkles size={14} /> AI MEMOIR & TRAVEL DIARY
            </p>
            <button
              type="button"
              className="primary small"
              onClick={handleGenerateDiary}
              disabled={generatingDiary}
            >
              {generatingDiary ? (
                <>
                  <LoaderCircle className="spin" size={16} /> Generating AI Story...
                </>
              ) : (
                <>
                  <Sparkles size={16} /> {diary ? "Regenerate AI Diary" : "Generate AI Travel Diary"}
                </>
              )}
            </button>
          </div>

          {error && <p className="error">{error}</p>}

          {!diary && !generatingDiary && (
            <div className="empty-trips" style={{ padding: "40px" }}>
              <Sparkles size={28} />
              <h2>No AI Travel Diary generated yet.</h2>
              <p>
                Click &quot;Generate AI Travel Diary&quot; to synthesize your schedule, logged expenses, notes, and photos
                into a rich narrative story.
              </p>
            </div>
          )}

          {diary && (
            <article className="diary-card">
              <h3 className="diary-title">{diary.title}</h3>
              <p className="diary-summary">{diary.summary}</p>
              {diary.totalSpent !== undefined && <p className="diary-spend">Recorded spending: {formatCurrency(diary.totalSpent, currency)}</p>}

              <div className="diary-prose">{diary.prose}</div>

              {diary.highlights && diary.highlights.length > 0 && (
                <>
                  <h4 className="diary-highlights-title">Journey Highlights & Takeaways</h4>
                  <div className="diary-highlights">
                    {diary.highlights.map((item, idx) => (
                      <span className="highlight-chip" key={idx}>
                        ✨ {item}
                      </span>
                    ))}
                  </div>
                </>
              )}

              {diary.reflection && (
                <div className="diary-reflection">
                  &ldquo;{diary.reflection}&rdquo;
                </div>
              )}
            </article>
          )}
        </div>
      )}
    </section>
  );
}
