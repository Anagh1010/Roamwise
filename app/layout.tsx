import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Roamwise — Travel that feels like you",
  description: "Your personal AI travel planner"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
