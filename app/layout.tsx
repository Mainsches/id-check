import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ID Radar – Identitätsrisiko prüfen",
  description:
    "Analysiere, wie sichtbar deine Identität online ist und erkenne potenzielle Risiken frühzeitig.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>
        <div className="app-container">
          <header className="main-header">
            <div className="logo">ID Radar</div>
          </header>

          {children}

          <footer className="main-footer">
            <a href="/privacy">Datenschutz</a>
            <span>·</span>
            <a href="/terms">AGB</a>
            <span>·</span>
            <a href="/imprint">Impressum</a>
          </footer>
        </div>
      </body>
    </html>
  );
}