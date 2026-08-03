"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, Clock3, Compass, DollarSign, Footprints, LoaderCircle, MapPin, MessageCircle, Send, Sparkles, Trash2, Utensils } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import type { Itinerary } from "@/lib/types";
import { getSupabaseClient, hasSupabaseAuth } from "@/lib/supabase";
import { formatCurrency } from "@/lib/currency";

type Trip = { id: string; destination: string; startDate: string; endDate: string; budget: number; itinerary: Itinerary };
const kindIcon = { explore: Compass, food: Utensils, move: Footprints, stay: MapPin };

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [activeDay, setActiveDay] = useState(0);
  const [error, setError] = useState("");
  const [revisionRequest, setRevisionRequest] = useState("");
  const [revisionMessage, setRevisionMessage] = useState("");
  const [revisionError, setRevisionError] = useState("");
  const [revising, setRevising] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!hasSupabaseAuth) { setUser(null); return; }
    getSupabaseClient().auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
  }, []);
  useEffect(() => {
    if (!user || !id) return;
    let cancelled = false;
    async function loadTrip() {
      try {
        const { data: { session } } = await getSupabaseClient().auth.getSession();
        if (!session) throw new Error("Your session has expired. Please sign in again.");
        const response = await fetch(`/api/trips/${id}`, { headers: { Authorization: `Bearer ${session.access_token}` } });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load this trip.");
        if (!cancelled) setTrip(data.trip);
      } catch (cause) { if (!cancelled) setError(cause instanceof Error ? cause.message : "Could not load this trip."); }
    }
    loadTrip();
    return () => { cancelled = true; };
  }, [id, user]);

  async function reviseTrip(event: FormEvent) {
    event.preventDefault();
    if (!id || !revisionRequest.trim()) return;
    setRevising(true); setRevisionError(""); setRevisionMessage("");
    try {
      const { data: { session } } = await getSupabaseClient().auth.getSession();
      if (!session) throw new Error("Your session has expired. Please sign in again.");
      const response = await fetch(`/api/trips/${id}/revise`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ request: revisionRequest }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not revise this itinerary.");
      setTrip(data.trip); setRevisionRequest("");
      setRevisionMessage(data.summary || "Your itinerary has been updated.");
      const firstChangedDay = data.changedDayNumbers?.[0];
      if (typeof firstChangedDay === "number") setActiveDay(Math.max(0, firstChangedDay - 1));
    } catch (cause) { setRevisionError(cause instanceof Error ? cause.message : "Could not revise this itinerary."); }
    finally { setRevising(false); }
  }

  async function deleteTrip() {
    if (!id || !confirm("Are you sure you want to delete this saved trip?")) return;
    setDeleting(true);
    try {
      const { data: { session } } = await getSupabaseClient().auth.getSession();
      if (!session) throw new Error("Your session has expired.");
      const response = await fetch(`/api/trips/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Could not delete trip.");
      }
      router.push("/trips");
    } catch (cause) {
      alert(cause instanceof Error ? cause.message : "Could not delete trip.");
      setDeleting(false);
    }
  }

  if (user === undefined || (user && !trip && !error)) return <main><nav className="nav shell"><Link className="brand" href="/"><span className="brand-mark"><Compass size={19}/></span>roamwise</Link></nav><div className="trips-status shell"><LoaderCircle className="spin" size={22}/> Loading your trip…</div></main>;
  if (!user || error) return <main><nav className="nav shell"><Link className="brand" href="/"><span className="brand-mark"><Compass size={19}/></span>roamwise</Link></nav><div className="trips-status shell trips-error"><p>{error || "Sign in to view your saved trips."}</p><Link href="/trips" className="secondary">Back to my trips</Link></div></main>;
  const day = trip!.itinerary.days[activeDay];
  const currency = trip!.itinerary.currency || "USD";
  return <main><nav className="nav shell"><Link className="brand" href="/"><span className="brand-mark"><Compass size={19}/></span>roamwise</Link><Link href="/trips" className="sign-in"><ArrowLeft size={16}/> My trips</Link></nav><section className="itinerary shell saved-itinerary"><div className="detail-top-bar"><Link href="/trips" className="back-link"><ArrowLeft size={16}/> Back to my trips</Link><button type="button" className="delete-detail-btn" onClick={deleteTrip} disabled={deleting}>{deleting ? <><LoaderCircle className="spin" size={14}/> Deleting…</> : <><Trash2 size={14}/> Delete trip</>}</button></div><div className="itinerary-head"><div><p className="eyebrow"><Sparkles size={14}/> SAVED ITINERARY</p><h2>{trip!.itinerary.title}</h2><p>{trip!.itinerary.overview}</p></div><div className="cost"><span>Est. per person</span><b>{formatCurrency(trip!.itinerary.totalEstimatedCost, currency)}</b><small>within your {formatCurrency(trip!.budget, currency)} budget</small></div></div><form className="trip-reviser" onSubmit={reviseTrip}><div><p className="eyebrow"><MessageCircle size={14}/> REFINE WITH AI</p><label htmlFor="revision-request">What should change?</label><textarea id="revision-request" value={revisionRequest} onChange={(event) => setRevisionRequest(event.target.value)} maxLength={600} placeholder="e.g. Replace Day 2's museums with outdoor activities under $80." required/></div><button className="primary small" disabled={revising}>{revising ? <><LoaderCircle className="spin" size={16}/> Updating…</> : <><Send size={16}/> Update trip</>}</button>{revisionMessage && <p className="revision-message">{revisionMessage}</p>}{revisionError && <p className="error revision-error">{revisionError}</p>}</form><div className="day-tabs">{trip!.itinerary.days.map((item, index) => <button onClick={() => setActiveDay(index)} className={index === activeDay ? "tab active" : "tab"} key={item.day}><b>Day {item.day}</b><span>{item.date}</span></button>)}</div><div className="schedule"><div className="day-title"><div><span>DAY {day.day} · {day.date.toUpperCase()}</span><h3>{day.theme}</h3></div></div><div className="timeline">{day.activities.map((activity, index) => { const Icon = kindIcon[activity.kind]; return <article className="activity" key={`${activity.time}-${index}`}><time>{activity.time}</time><div className={`activity-icon ${activity.kind}`}><Icon size={19}/></div><div className="activity-body"><div><h4>{activity.title}</h4><p className="place"><MapPin size={14}/>{activity.place}</p></div><p>{activity.description}</p><div className="activity-meta"><span><Clock3 size={14}/>{activity.duration}</span><span>{formatCurrency(activity.cost, currency)} est.</span></div></div></article>; })}</div><div className="saved-trip-facts"><span><MapPin size={16}/>{trip!.destination}</span><span><CalendarDays size={16}/>{new Date(trip!.startDate).toLocaleDateString()} – {new Date(trip!.endDate).toLocaleDateString()}</span><span><Footprints size={16}/>{trip!.itinerary.packingTips.join(" · ")}</span></div></div></section></main>;
}
