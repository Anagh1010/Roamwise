"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Clock3, Compass, DollarSign, Footprints, GripVertical, LoaderCircle, MapPin, Menu, Plus, Sparkles, Star, Utensils } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import type { Itinerary, PlannerInput } from "@/lib/types";
import { getSupabaseClient, hasSupabaseAuth } from "@/lib/supabase";
import { CURRENCIES, formatCurrency, getCurrencySymbol } from "@/lib/currency";

const interestOptions = ["Food & drink", "Art & culture", "Nature", "History", "Shopping", "Nightlife"];
const today = new Date();
const iso = (date: Date) => date.toISOString().slice(0, 10);
const later = new Date(today); later.setDate(today.getDate() + 4);

const kindIcon = { explore: Compass, food: Utensils, move: Footprints, stay: MapPin };

export default function Home() {
  const [form, setForm] = useState<PlannerInput>({
    destination: "Lisbon, Portugal",
    startDate: iso(today),
    endDate: iso(later),
    budget: 1200,
    currency: "USD",
    pace: "Balanced",
    interests: ["Food & drink", "Art & culture"]
  });
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [source, setSource] = useState<"ai" | "demo" | null>(null);
  const [activeDay, setActiveDay] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signIn" | "signUp">("signIn");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [mapUrl, setMapUrl] = useState("");
  const [error, setError] = useState("");
  const [custom, setCustom] = useState("");

  const nights = useMemo(() => Math.max(1, Math.round((new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) / 86_400_000)), [form.endDate, form.startDate]);
  const toggleInterest = (interest: string) => setForm((old) => ({ ...old, interests: old.interests.includes(interest) ? old.interests.filter((item) => item !== interest) : [...old.interests, interest] }));

  useEffect(() => {
    if (!hasSupabaseAuth) return;
    const client = getSupabaseClient();
    client.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => listener.subscription.unsubscribe();
  }, []);

  async function createTrip(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError("");
    try {
      const response = await fetch("/api/itinerary", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "We could not create this trip.");
      setItinerary(data.itinerary); setSource(data.source); setActiveDay(0);
      setMapUrl(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(form.destination)}`);
      fetch(`/api/places?query=${encodeURIComponent(form.destination)}`).then((result) => result.json()).then((placeData) => {
        if (placeData.place) setMapUrl(`https://www.google.com/maps/search/?api=1&query=${placeData.place.latitude},${placeData.place.longitude}`);
      }).catch(() => undefined);
      document.getElementById("itinerary")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong."); }
    finally { setLoading(false); }
  }

  async function saveTrip() {
    if (!itinerary) return;
    if (!user) { setAuthOpen(true); setAuthMessage("Sign in or create an account to save this trip."); return; }
    setSaving(true); setSaveMessage("");
    try {
      const { data: { session } } = await getSupabaseClient().auth.getSession();
      if (!session) throw new Error("Your session has expired. Please sign in again.");
      const response = await fetch("/api/trips", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ ...form, itinerary }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save this trip.");
      setSaveMessage("Saved to your trips.");
    } catch (err) { setSaveMessage(err instanceof Error ? err.message : "Could not save this trip."); }
    finally { setSaving(false); }
  }

  async function submitAuth(event: FormEvent) {
    event.preventDefault();
    if (!hasSupabaseAuth) { setAuthMessage("Add your Supabase URL and publishable key to .env first."); return; }
    setAuthLoading(true); setAuthMessage("");
    const client = getSupabaseClient();
    const result = authMode === "signIn"
      ? await client.auth.signInWithPassword({ email: authEmail, password: authPassword })
      : await client.auth.signUp({ email: authEmail, password: authPassword });
    if (result.error) setAuthMessage(result.error.message);
    else if (authMode === "signUp" && !result.data.session) setAuthMessage("Check your email to confirm your account, then sign in.");
    else { setAuthOpen(false); setAuthPassword(""); }
    setAuthLoading(false);
  }

  async function signOut() { if (hasSupabaseAuth) await getSupabaseClient().auth.signOut(); }

  const day = itinerary?.days[activeDay];
  const activeCurrency = itinerary?.currency || form.currency || "USD";

  return <main>
    <nav className="nav shell"><a className="brand" href="#top"><span className="brand-mark"><Compass size={19}/></span>roamwise</a><div className="nav-links"><a href="#planner">Plan a trip</a><a href="#how">How it works</a><a href="/trips">My trips</a></div><button className="menu" aria-label="Open menu"><Menu size={21}/></button>{user ? <button onClick={signOut} className="sign-in">Sign out</button> : <button onClick={() => { setAuthMode("signIn"); setAuthOpen(true); setAuthMessage(""); }} className="sign-in">Sign in <ArrowUpRight size={15}/></button>}</nav>

    <section id="top" className="hero shell">
      <div className="hero-copy"><p className="eyebrow"><Sparkles size={14}/> PERSONAL TRAVEL DESIGNER</p><h1>Trips that feel<br/><i>like you.</i></h1><p className="lede">Tell us what matters. We’ll shape the days, find the rhythm, and leave room for your best detours.</p><a href="#planner" className="text-link">Start planning <ArrowUpRight size={18}/></a></div>
      <div className="hero-art" aria-label="An illustrated Mediterranean travel scene"><div className="sun"></div><div className="plane">✈</div><div className="cloud cloud-one"></div><div className="cloud cloud-two"></div><div className="mountain back"></div><div className="mountain front"></div><div className="sea"></div><div className="postcard"><span>Olá from</span><b>Lisbon</b><small>Seek more, rush less.</small></div><div className="pin pin-one"><MapPin fill="currentColor"/></div><div className="pin pin-two"><MapPin fill="currentColor"/></div></div>
    </section>

    <section id="planner" className="planner-wrap"><div className="planner shell"><div className="planner-intro"><p className="eyebrow"><Sparkles size={14}/> YOUR NEXT ADVENTURE</p><h2>Where to?</h2><p>Give us the outline. We’ll bring the local knowledge, timing, and a little magic.</p></div>
      <form onSubmit={createTrip} className="trip-form">
        <label className="field destination"><span>Destination</span><div><MapPin size={18}/><input value={form.destination} onChange={(e) => setForm({...form, destination: e.target.value})} placeholder="City or region" required/><ChevronDown size={17}/></div></label>
        <label className="field"><span>When</span><div><CalendarDays size={18}/><input aria-label="Start date" type="date" value={form.startDate} onChange={(e) => setForm({...form, startDate: e.target.value})} required/><span className="date-dash">—</span><input aria-label="End date" type="date" value={form.endDate} onChange={(e) => setForm({...form, endDate: e.target.value})} required/></div><small>{nights} night{nights !== 1 ? "s" : ""}</small></label>
        <label className="field budget"><span>Budget</span><div><span className="currency-symbol">{getCurrencySymbol(form.currency || "USD")}</span><input type="number" min="10" value={form.budget} onChange={(e) => setForm({...form, budget: Number(e.target.value)})} required/><select className="currency-select" value={form.currency || "USD"} onChange={(e) => setForm({...form, currency: e.target.value})}>{CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}</select></div></label>
        <div className="form-row"><div><span className="label">I’m into</span><div className="chips">{interestOptions.map((interest) => <button type="button" className={form.interests.includes(interest) ? "chip active" : "chip"} onClick={() => toggleInterest(interest)} key={interest}>{form.interests.includes(interest) && <Check size={13}/>} {interest}</button>)}</div></div><div><span className="label">Travel pace</span><div className="segmented">{(["Slow", "Balanced", "Fast"] as const).map((pace) => <button type="button" onClick={() => setForm({...form, pace})} className={form.pace === pace ? "selected" : ""} key={pace}>{pace}</button>)}</div></div></div>
        <label className="access"><span>Anything we should know? <em>(optional)</em></span><input value={custom} onChange={(e) => { setCustom(e.target.value); setForm({...form, accessibility: e.target.value}); }} placeholder="Accessibility needs, special occasion, travelling with kids..."/></label>
        {error && <p className="error">{error}</p>}<button className="primary" disabled={loading}>{loading ? <><LoaderCircle className="spin" size={18}/> Building your trip</> : <><Sparkles size={18}/> Craft my itinerary</>}</button>
      </form>
    </div></section>

    {itinerary && day && <section id="itinerary" className="itinerary shell"><div className="itinerary-head"><div><p className="eyebrow"><Sparkles size={14}/> {source === "ai" ? "AI-CURATED FOR YOU" : "SMART DEMO ITINERARY"}</p><h2>{itinerary.title}</h2><p>{itinerary.overview}</p></div><div className="cost"><span>Est. per person</span><b>{formatCurrency(itinerary.totalEstimatedCost, activeCurrency)}</b><small>within your {formatCurrency(form.budget, form.currency || "USD")} budget</small></div></div>
      {source === "demo" && <div className="demo-note"><Sparkles size={16}/> Add a free Gemini API key for a fully personalised AI itinerary. This preview lets you explore the complete experience now.</div>}
      <div className="day-tabs">{itinerary.days.map((item, index) => <button onClick={() => setActiveDay(index)} className={index === activeDay ? "tab active" : "tab"} key={item.day}><b>Day {item.day}</b><span>{item.date}</span></button>)}</div>
      <div className="schedule"><div className="day-title"><div><span>DAY {day.day} · {day.date.toUpperCase()}</span><h3>{day.theme}</h3></div><button className="icon-button" aria-label="Previous day" onClick={() => setActiveDay(Math.max(0, activeDay - 1))}><ChevronLeft/></button><button className="icon-button" aria-label="Next day" onClick={() => setActiveDay(Math.min(itinerary.days.length - 1, activeDay + 1))}><ChevronRight/></button></div>
        <div className="timeline">{day.activities.map((activity, index) => { const Icon = kindIcon[activity.kind]; return <article className="activity" key={`${activity.time}-${index}`}><time>{activity.time}</time><div className={`activity-icon ${activity.kind}`}><Icon size={19}/></div><div className="activity-body"><div><h4>{activity.title}</h4><p className="place"><MapPin size={14}/>{activity.place}</p></div><p>{activity.description}</p><div className="activity-meta"><span><Clock3 size={14}/>{activity.duration}</span><span>{formatCurrency(activity.cost, activeCurrency)} est.</span></div></div><button className="drag" aria-label="Reorder activity"><GripVertical size={19}/></button></article>})}</div>
        <button className="add-activity"><Plus size={18}/> Add an activity</button>
      </div>
      <div className="trip-footer"><div><b>Pack lightly, wander deeply.</b><span>{itinerary.packingTips.join(" · ")}</span>{saveMessage && <small className="save-message">{saveMessage}</small>}</div><div className="trip-actions"><a className="map-link" href={mapUrl} target="_blank" rel="noreferrer"><MapPin size={16}/> Open map</a><button onClick={saveTrip} disabled={saving} className="primary small"><Star size={16}/>{saving ? "Saving…" : "Save this trip"}</button></div></div>
    </section>}

    <section id="how" className="how shell"><p className="eyebrow"><Sparkles size={14}/> HOW IT WORKS</p><h2>Good planning leaves room<br/>for the unexpected.</h2><div className="steps"><div><b>01</b><h3>Tell us your style</h3><p>Dates, budget, curiosities, and the pace that feels right.</p></div><div><b>02</b><h3>Get a flexible plan</h3><p>A thoughtful day-by-day route, not a minute-by-minute mandate.</p></div><div><b>03</b><h3>Make it yours</h3><p>Move things around and follow the recommendations that spark joy.</p></div></div></section>
    {authOpen && <div className="auth-backdrop" role="dialog" aria-modal="true" aria-labelledby="auth-title"><form className="auth-card" onSubmit={submitAuth}><button className="auth-close" type="button" onClick={() => setAuthOpen(false)} aria-label="Close">×</button><p className="eyebrow"><Sparkles size={14}/> YOUR ROAMWISE ACCOUNT</p><h2 id="auth-title">{authMode === "signIn" ? "Welcome back." : "Start saving trips."}</h2><p className="auth-copy">{authMode === "signIn" ? "Sign in to keep your itineraries in one place." : "Create an account to save trips and return to them later."}</p><label>Email<input type="email" autoComplete="email" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} required/></label><label>Password<input type="password" autoComplete={authMode === "signIn" ? "current-password" : "new-password"} minLength={6} value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} required/></label>{authMessage && <p className="auth-message">{authMessage}</p>}<button className="primary auth-submit" disabled={authLoading}>{authLoading ? "Please wait…" : authMode === "signIn" ? "Sign in" : "Create account"}</button><button className="auth-switch" type="button" onClick={() => { setAuthMode(authMode === "signIn" ? "signUp" : "signIn"); setAuthMessage(""); }}>{authMode === "signIn" ? "New here? Create an account" : "Already have an account? Sign in"}</button></form></div>}
    <footer className="footer"><div className="shell"><a className="brand" href="#top"><span className="brand-mark"><Compass size={19}/></span>roamwise</a><p>Made for the beautifully curious.</p></div></footer>
  </main>;
}
