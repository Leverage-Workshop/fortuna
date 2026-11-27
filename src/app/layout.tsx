import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fortuna",
  description: "Geopolitical forecasts from material constraints, checked against prediction markets.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={fontVariables}>
      <body className="min-h-screen antialiased">
        <SiteHeader />
        <main className="mx-auto w-full max-w-[1280px] px-4 pt-8 pb-24 sm:px-6 lg:px-12">{children}</main>
      </body>
    </html>
  );
}
