"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ArrowUpRight, CalendarDays, Compass, LoaderCircle, MapPin, Sparkles, Trash2 } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseClient, hasSupabaseAuth } from "@/lib/supabase";

type SavedTrip = {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  interests: string[];
  itinerary: { title?: string };
  updatedAt: string;
};

const dateFormat = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const formatDate = (date: string) => dateFormat.format(new Date(date));

export default function TripsPage() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [authMode, setAuthMode] = useState<"signIn" | "signUp">("signIn");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    if (!hasSupabaseAuth) { setUser(null); return; }
    const client = getSupabaseClient();
    client.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function loadTrips() {
      setLoading(true); setError("");
      try {
        const { data: { session } } = await getSupabaseClient().auth.getSession();
        if (!session) throw new Error("Your session has expired. Please sign in again.");
        const response = await fetch("/api/trips", { headers: { Authorization: `Bearer ${session.access_token}` } });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load your trips.");
        if (!cancelled) setTrips(data.trips);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Could not load your trips.");
      } finally { if (!cancelled) setLoading(false); }
    }
    loadTrips();
    return () => { cancelled = true; };
  }, [user]);

  async function deleteTrip(event: React.MouseEvent, tripId: string) {
    event.preventDefault();
    event.stopPropagation();
    if (!confirm("Are you sure you want to delete this trip?")) return;
    setDeletingId(tripId);
    try {
      const { data: { session } } = await getSupabaseClient().auth.getSession();
      if (!session) throw new Error("Your session has expired.");
      const response = await fetch(`/api/trips/${tripId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Could not delete trip.");
      }
      setTrips((prev) => prev.filter((t) => t.id !== tripId));
    } catch (cause) {
      alert(cause instanceof Error ? cause.message : "Could not delete trip.");
    } finally {
      setDeletingId(null);
    }
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
    else setAuthPassword("");
    setAuthLoading(false);
  }

  async function signOut() { if (hasSupabaseAuth) await getSupabaseClient().auth.signOut(); }

  return <main className="trips-page">
    <nav className="nav shell"><Link className="brand" href="/"><span className="brand-mark"><Compass size={19}/></span>roamwise</Link><div className="nav-links"><Link href="/#planner">Plan a trip</Link><Link href="/#how">How it works</Link><Link href="/trips" aria-current="page">My trips</Link></div>{user ? <button onClick={signOut} className="sign-in">Sign out</button> : <Link className="sign-in" href="/">Home <ArrowUpRight size={15}/></Link>}</nav>
    <section className="trips-hero"><div className="shell"><p className="eyebrow"><Sparkles size={14}/> YOUR TRAVEL LIBRARY</p><h1>My trips.</h1><p>Every itinerary you save, ready whenever the next adventure calls.</p></div></section>
    <section className="trips-library shell">
      {user === undefined && <div className="trips-status"><LoaderCircle className="spin" size={22}/> Checking your account…</div>}
      {user === null && <div className="account-prompt"><p className="eyebrow"><Compass size={14}/> YOUR TRIPS, IN ONE PLACE</p><h2>Sign in to see where you&apos;re going.</h2><p>Saved itineraries are private to your account and available across your devices.</p><form onSubmit={submitAuth} className="library-auth"><label>Email<input type="email" autoComplete="email" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} required/></label><label>Password<input type="password" autoComplete={authMode === "signIn" ? "current-password" : "new-password"} minLength={6} value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} required/></label>{authMessage && <p className="auth-message">{authMessage}</p>}<button className="primary" disabled={authLoading}>{authLoading ? "Please wait…" : authMode === "signIn" ? "Sign in" : "Create account"}</button><button className="auth-switch" type="button" onClick={() => { setAuthMode(authMode === "signIn" ? "signUp" : "signIn"); setAuthMessage(""); }}>{authMode === "signIn" ? "New here? Create an account" : "Already have an account? Sign in"}</button></form></div>}
      {user && loading && <div className="trips-status"><LoaderCircle className="spin" size={22}/> Loading your saved trips…</div>}
      {user && !loading && error && <div className="trips-status trips-error"><p>{error}</p><button className="secondary" onClick={() => setUser({ ...user })}>Try again</button></div>}
      {user && !loading && !error && trips.length === 0 && <div className="empty-trips"><MapPin size={28}/><h2>No saved trips yet.</h2><p>Plan your next escape, then save the itinerary here for later.</p><Link href="/#planner" className="primary">Plan a trip <ArrowUpRight size={16}/></Link></div>}
      {user && !loading && !error && trips.length > 0 && <div className="trip-grid">{trips.map((trip) => <Link href={`/trips/${trip.id}`} className="trip-card" key={trip.id}><div className="trip-card-top"><span><MapPin size={15}/>{trip.destination}</span><div className="trip-card-actions"><button type="button" className="delete-trip-btn" title="Delete trip" onClick={(e) => deleteTrip(e, trip.id)} disabled={deletingId === trip.id}>{deletingId === trip.id ? <LoaderCircle className="spin" size={14}/> : <Trash2 size={14}/>}</button><ArrowUpRight size={18}/></div></div><h2>{trip.itinerary?.title || `A trip to ${trip.destination}`}</h2><p className="trip-dates"><CalendarDays size={15}/>{formatDate(trip.startDate)} – {formatDate(trip.endDate)}</p><div className="trip-card-bottom"><span>${trip.budget.toLocaleString()} budget</span><span>Updated {formatDate(trip.updatedAt)}</span></div><div className="trip-tags">{trip.interests.slice(0, 3).map((interest) => <span key={interest}>{interest}</span>)}</div></Link>)}</div>}
    </section>
  </main>;
}
