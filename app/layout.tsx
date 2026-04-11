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

        <footer className="site-footer">
          <nav className="site-footer-nav" aria-label="Rechtliches">
            <a className="site-footer-link" href="/privacy">
              Datenschutz
            </a>
            <span className="site-footer-sep" aria-hidden="true">
              ·
            </span>
            <a className="site-footer-link" href="/terms">
              Nutzungsbedingungen
            </a>
            <span className="site-footer-sep" aria-hidden="true">
              ·
            </span>
            <a className="site-footer-link" href="/imprint">
              Impressum
            </a>
          </nav>
        </footer>
      </body>
    </html>
  );
}