"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("roamwise-theme", theme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("roamwise-theme");
    const nextTheme: Theme = savedTheme === "light" || savedTheme === "dark" ? savedTheme : "dark";
    setTheme(nextTheme);
    applyTheme(nextTheme);
  }, []);

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => {
        const nextTheme = isDark ? "light" : "dark";
        setTheme(nextTheme);
        applyTheme(nextTheme);
      }}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {isDark ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
      <span>{isDark ? "Light" : "Dark"}</span>
    </button>
  );
}
