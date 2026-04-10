import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ID Radar – Identitätsrisiko prüfen",
  description:
    "Prüfe, wie sichtbar deine Identität online ist, erkenne mögliche Verknüpfungen und reduziere dein Risiko.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body>
        {children}

        <footer
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "16px 20px 30px",
            color: "rgba(255,255,255,0.58)",
            fontSize: 14,
            textAlign: "center",
            letterSpacing: "0.01em",
          }}
        >
          <a
            href="/privacy"
            style={{
              color: "rgba(255,255,255,0.78)",
              textDecoration: "none",
              margin: "0 8px",
              transition: "opacity 0.2s ease",
            }}
          >
            Datenschutz
          </a>
          ·
          <a
            href="/terms"
            style={{
              color: "rgba(255,255,255,0.78)",
              textDecoration: "none",
              margin: "0 8px",
              transition: "opacity 0.2s ease",
            }}
          >
            Nutzungsbedingungen
          </a>
          ·
          <a
            href="/imprint"
            style={{
              color: "rgba(255,255,255,0.78)",
              textDecoration: "none",
              margin: "0 8px",
              transition: "opacity 0.2s ease",
            }}
          >
            Impressum
          </a>
        </footer>
      </body>
    </html>
  );
}