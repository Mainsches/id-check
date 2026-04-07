import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Identity Risk Scanner",
  description: "Minimal MVP to simulate online identity exposure and produce a risk score.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}