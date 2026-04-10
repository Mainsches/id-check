import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Identity Risk Scanner",
  description:
    "Minimal MVP to simulate online identity exposure and produce a risk score.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}

        <footer
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "12px 20px 28px",
            color: "rgba(255,255,255,0.55)",
            fontSize: 14,
            textAlign: "center",
          }}
        >
          <a
            href="/privacy"
            style={{
              color: "rgba(255,255,255,0.72)",
              textDecoration: "none",
              margin: "0 8px",
            }}
          >
            Privacy
          </a>
          ·
          <a
            href="/terms"
            style={{
              color: "rgba(255,255,255,0.72)",
              textDecoration: "none",
              margin: "0 8px",
            }}
          >
            Terms
          </a>
          ·
          <a
            href="/imprint"
            style={{
              color: "rgba(255,255,255,0.72)",
              textDecoration: "none",
              margin: "0 8px",
            }}
          >
            Imprint
          </a>
        </footer>
      </body>
    </html>
  );
}