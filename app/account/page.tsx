"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Compass, KeyRound, LoaderCircle, Mail, ShieldCheck } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { AccountMenu } from "@/components/account-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { getSupabaseClient, hasSupabaseAuth } from "@/lib/supabase";

export default function AccountPage() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [email, setEmail] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nonce, setNonce] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [reauthLoading, setReauthLoading] = useState(false);

  useEffect(() => {
    if (!hasSupabaseAuth) { setUser(null); return; }
    const client = getSupabaseClient();
    client.auth.getSession().then(({ data }) => {
      const nextUser = data.session?.user ?? null;
      setUser(nextUser);
      setEmail(nextUser?.email ?? "");
    });
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      setEmail(nextUser?.email ?? "");
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function signOut() { if (hasSupabaseAuth) await getSupabaseClient().auth.signOut(); }

  async function updateEmail(event: FormEvent) {
    event.preventDefault();
    if (!user || !email.trim()) return;
    if (email.trim().toLowerCase() === user.email?.toLowerCase()) { setEmailMessage("That is already your account email."); return; }
    setEmailLoading(true); setEmailMessage("");
    const { error } = await getSupabaseClient().auth.updateUser({ email: email.trim() }, { emailRedirectTo: `${window.location.origin}/account` });
    setEmailMessage(error ? error.message : "Check your old and new inboxes to confirm the email change.");
    setEmailLoading(false);
  }

  async function requestReauthentication() {
    setReauthLoading(true); setPasswordMessage("");
    const { error } = await getSupabaseClient().auth.reauthenticate();
    setPasswordMessage(error ? error.message : "We sent a verification code to your email. Enter it below, then save your new password.");
    setReauthLoading(false);
  }

  async function updatePassword(event: FormEvent) {
    event.preventDefault();
    if (newPassword.length < 8) { setPasswordMessage("Choose a password with at least 8 characters."); return; }
    if (newPassword !== confirmPassword) { setPasswordMessage("The new passwords do not match."); return; }
    setPasswordLoading(true); setPasswordMessage("");
    const { error } = await getSupabaseClient().auth.updateUser({
      password: newPassword,
      current_password: currentPassword,
      nonce: nonce.trim() || undefined,
    });
    if (error) setPasswordMessage(error.message);
    else {
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setNonce("");
      setPasswordMessage("Password updated successfully.");
    }
    setPasswordLoading(false);
  }

  if (user === undefined) return <main><nav className="nav shell"><Link className="brand" href="/"><span className="brand-mark"><Compass size={19}/></span>roamwise</Link><div className="nav-actions"><ThemeToggle/></div></nav><div className="trips-status shell"><LoaderCircle className="spin" size={22}/> Checking your account…</div></main>;
  if (!user) return <main><nav className="nav shell"><Link className="brand" href="/"><span className="brand-mark"><Compass size={19}/></span>roamwise</Link><div className="nav-actions"><ThemeToggle/></div></nav><section className="account-page shell"><div className="account-panel"><p className="eyebrow"><ShieldCheck size={14}/> ACCOUNT SETTINGS</p><h1>Sign in to manage your account.</h1><p>Account email and password controls are available after you sign in.</p><Link className="primary" href="/">Back home</Link></div></section></main>;

  return <main><nav className="nav shell"><Link className="brand" href="/"><span className="brand-mark"><Compass size={19}/></span>roamwise</Link><div className="nav-links"><Link href="/#planner">Plan a trip</Link><Link href="/trips">My trips</Link></div><div className="nav-actions"><ThemeToggle/><AccountMenu email={user.email} onSignOut={signOut}/></div></nav><section className="account-page shell"><Link href="/" className="back-link"><ArrowLeft size={16}/> Back home</Link><p className="eyebrow"><ShieldCheck size={14}/> ACCOUNT SETTINGS</p><h1>Manage your account.</h1><p className="account-lede">Keep your sign-in details up to date. Email changes require confirmation before they take effect.</p><div className="account-settings-grid"><form className="account-panel" onSubmit={updateEmail}><div className="account-panel-icon"><Mail size={19}/></div><h2>Email address</h2><p>Use an address you can access. Supabase will verify the change securely.</p><label htmlFor="account-email">Email<input id="account-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required/></label><button className="primary" disabled={emailLoading}>{emailLoading ? <><LoaderCircle className="spin" size={15}/> Saving…</> : "Update email"}</button>{emailMessage && <p className="account-message"><CheckCircle2 size={14}/>{emailMessage}</p>}</form><form className="account-panel" onSubmit={updatePassword}><div className="account-panel-icon"><KeyRound size={19}/></div><h2>Password</h2><p>Enter your current password and choose a unique new password of at least 8 characters.</p><label htmlFor="current-password">Current password<input id="current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required/></label><label htmlFor="new-password">New password<input id="new-password" type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={8} required/></label><label htmlFor="confirm-password">Confirm new password<input id="confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} required/></label><div className="reauth-row"><label htmlFor="password-nonce">Verification code <span>(if requested)</span><input id="password-nonce" inputMode="numeric" autoComplete="one-time-code" value={nonce} onChange={(event) => setNonce(event.target.value)} placeholder="6-digit code"/></label><button type="button" className="text-button" onClick={requestReauthentication} disabled={reauthLoading}>{reauthLoading ? "Sending…" : "Send code"}</button></div><button className="primary" disabled={passwordLoading}>{passwordLoading ? <><LoaderCircle className="spin" size={15}/> Updating…</> : "Update password"}</button>{passwordMessage && <p className="account-message"><CheckCircle2 size={14}/>{passwordMessage}</p>}</form></div></section></main>;
}
