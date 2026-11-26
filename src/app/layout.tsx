import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fortuna",
  description: "Geopolitical forecasts from material constraints, checked against prediction markets.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
