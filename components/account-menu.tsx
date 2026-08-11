"use client";

import Link from "next/link";
import { ChevronDown, LogOut, Settings, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type AccountMenuProps = {
  email?: string;
  onSignOut: () => void | Promise<void>;
};

export function AccountMenu({ email, onSignOut }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return <div className="account-menu" ref={menuRef}>
    <button type="button" className="account-menu-trigger" onClick={() => setOpen((current) => !current)} aria-expanded={open} aria-haspopup="menu">
      <UserRound size={15}/><span>Account</span><ChevronDown size={14}/>
    </button>
    {open && <div className="account-menu-popover" role="menu">
      <div className="account-menu-identity"><UserRound size={17}/><div><b>Signed in</b><span>{email || "Your Roamwise account"}</span></div></div>
      <Link href="/account" role="menuitem" onClick={() => setOpen(false)}><Settings size={15}/> Account settings</Link>
      <button type="button" role="menuitem" onClick={() => { setOpen(false); void onSignOut(); }}><LogOut size={15}/> Sign out</button>
    </div>}
  </div>;
}
