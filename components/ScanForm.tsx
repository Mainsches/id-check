"use client";

import Script from "next/script";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ScanRequestBody, ScanResponse } from "@/types/scan";

type ScanFormProps = {
  onResult: (result: ScanResponse) => void;
};

declare global {
  interface Window {
    onTurnstileSuccess?: (token: string) => void;
    onTurnstileExpired?: () => void;
    onTurnstileError?: (errorCode?: string | number) => boolean | void;
  }
}

const initialState: ScanRequestBody = {
  firstName: "",
  lastName: "",
  city: "",
  username: "",
  email: "",
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const BROWSER_SCAN_KEY = "idradar_last_scan_at";

function getRemainingMs(lastScanAt: number) {
  return Math.max(0, ONE_DAY_MS - (Date.now() - lastScanAt));
}

function formatRemainingTime(ms: number) {
  const totalMinutes = Math.ceil(ms / 1000 / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) {
    return `${minutes} Minute${minutes === 1 ? "" : "n"}`;
  }

  if (minutes === 0) {
    return `${hours} Stunde${hours === 1 ? "" : "n"}`;
  }

  return `${hours} Stunde${hours === 1 ? "" : "n"} und ${minutes} Minute${minutes === 1 ? "" : "n"}`;
}

export default function ScanForm({ onResult }: ScanFormProps) {
  const [formData, setFormData] = useState<ScanRequestBody>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [confirmOwnership, setConfirmOwnership] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReady, setTurnstileReady] = useState(false);
  const [browserBlockedUntil, setBrowserBlockedUntil] = useState<number | null>(
    null
  );

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    window.onTurnstileSuccess = (token: string) => {
      setTurnstileToken(token);
      setError("");
    };

    window.onTurnstileExpired = () => {
      setTurnstileToken("");
    };

    window.onTurnstileError = () => {
      setTurnstileToken("");
      setError(
        "Die Sicherheitsprüfung konnte nicht geladen werden. Bitte lade die Seite neu."
      );
      return true;
    };

    return () => {
      delete window.onTurnstileSuccess;
      delete window.onTurnstileExpired;
      delete window.onTurnstileError;
    };
  }, []);

  useEffect(() => {
    const raw = window.localStorage.getItem(BROWSER_SCAN_KEY);

    if (!raw) return;

    const lastScanAt = Number(raw);

    if (!Number.isFinite(lastScanAt)) {
      window.localStorage.removeItem(BROWSER_SCAN_KEY);
      return;
    }

    const remainingMs = getRemainingMs(lastScanAt);

    if (remainingMs > 0) {
      setBrowserBlockedUntil(lastScanAt + ONE_DAY_MS);
    } else {
      window.localStorage.removeItem(BROWSER_SCAN_KEY);
    }
  }, []);

  const browserLimitMessage = useMemo(() => {
    if (!browserBlockedUntil) return "";

    const remainingMs = browserBlockedUntil - Date.now();

    if (remainingMs <= 0) return "";

    return `Von diesem Browser wurde heute bereits ein Scan durchgeführt. Bitte versuche es in ${formatRemainingTime(
      remainingMs
    )} erneut.`;
  }, [browserBlockedUntil]);

  function updateField<K extends keyof ScanRequestBody>(
    key: K,
    value: ScanRequestBody[K]
  ) {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (browserBlockedUntil && browserBlockedUntil > Date.now()) {
      setError(browserLimitMessage);
      return;
    }

    if (!confirmOwnership) {
      setError(
        "Bitte bestätige, dass du deine eigenen Daten prüfst oder dazu berechtigt bist."
      );
      return;
    }

    if (!acceptTerms) {
      setError(
        "Bitte akzeptiere die Nutzungsbedingungen und die Datenschutzerklärung."
      );
      return;
    }

    if (!turnstileToken) {
      setError(
        "Bitte bestätige zuerst die Sicherheitsprüfung, bevor du den Scan startest."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          turnstileToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || "Beim Scan ist ein Fehler aufgetreten.");
        return;
      }

      const now = Date.now();
      window.localStorage.setItem(BROWSER_SCAN_KEY, String(now));
      setBrowserBlockedUntil(now + ONE_DAY_MS);

      onResult(data as ScanResponse);
    } catch {
      setError("Netzwerkfehler. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {siteKey ? (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          async
          defer
          onLoad={() => setTurnstileReady(true)}
        />
      ) : null}

      <form className="scan-form fade-in" onSubmit={handleSubmit}>
        <div className="form-intro">
          <span className="eyebrow">ID Radar</span>
          <h1>Wie sichtbar ist deine Identität online?</h1>
          <p>
            Prüfe öffentliche Spuren, mögliche Profil-Treffer und erkennbare
            Verknüpfungen deiner Identität im Internet.
          </p>
        </div>

        <div className="form-grid">
          <div className="field">
            <label htmlFor="firstName">Vorname</label>
            <input
              id="firstName"
              type="text"
              placeholder="Max"
              value={formData.firstName}
              onChange={(e) => updateField("firstName", e.target.value)}
              required
              disabled={Boolean(browserBlockedUntil && browserBlockedUntil > Date.now())}
            />
          </div>

          <div className="field">
            <label htmlFor="lastName">Nachname</label>
            <input
              id="lastName"
              type="text"
              placeholder="Muster"
              value={formData.lastName}
              onChange={(e) => updateField("lastName", e.target.value)}
              required
              disabled={Boolean(browserBlockedUntil && browserBlockedUntil > Date.now())}
            />
          </div>

          <div className="field">
            <label htmlFor="city">
              Stadt <span className="optional">(optional)</span>
            </label>
            <input
              id="city"
              type="text"
              placeholder="Zürich"
              value={formData.city}
              onChange={(e) => updateField("city", e.target.value)}
              disabled={Boolean(browserBlockedUntil && browserBlockedUntil > Date.now())}
            />
          </div>

          <div className="field">
            <label htmlFor="username">
              Benutzername <span className="optional">(optional)</span>
            </label>
            <input
              id="username"
              type="text"
              placeholder="max.muster"
              value={formData.username}
              onChange={(e) => updateField("username", e.target.value)}
              disabled={Boolean(browserBlockedUntil && browserBlockedUntil > Date.now())}
            />
          </div>

          <div className="field field-full">
            <label htmlFor="email">
              E-Mail <span className="optional">(optional)</span>
            </label>
            <input
              id="email"
              type="email"
              placeholder="max@example.com"
              value={formData.email}
              onChange={(e) => updateField("email", e.target.value)}
              disabled={Boolean(browserBlockedUntil && browserBlockedUntil > Date.now())}
            />
          </div>
        </div>

        <div className="privacy-box">
          <p>
            Kein Login. Keine dauerhafte Speicherung. Deine Eingaben werden nur
            während der Anfrage verarbeitet und als temporäres Ergebnis
            zurückgegeben.
          </p>
        </div>

        <div
          style={{
            marginBottom: 18,
            padding: "16px 18px",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 16,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.025))",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              marginBottom: 12,
              color: "rgba(255,255,255,0.84)",
              lineHeight: 1.55,
              cursor: "pointer",
              fontSize: 14,
              opacity:
                browserBlockedUntil && browserBlockedUntil > Date.now() ? 0.6 : 1,
            }}
          >
            <input
              type="checkbox"
              checked={confirmOwnership}
              onChange={(e) => setConfirmOwnership(e.target.checked)}
              style={{ marginTop: 3 }}
              disabled={Boolean(browserBlockedUntil && browserBlockedUntil > Date.now())}
            />
            <span>
              Ich bestätige, dass ich meine eigenen Daten prüfe oder zur
              Durchführung dieser Suche berechtigt bin.
            </span>
          </label>

          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              color: "rgba(255,255,255,0.84)",
              lineHeight: 1.55,
              cursor: "pointer",
              fontSize: 14,
              opacity:
                browserBlockedUntil && browserBlockedUntil > Date.now() ? 0.6 : 1,
            }}
          >
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              style={{ marginTop: 3 }}
              disabled={Boolean(browserBlockedUntil && browserBlockedUntil > Date.now())}
            />
            <span>
              Ich akzeptiere die{" "}
              <a
                href="/terms"
                target="_blank"
                rel="noreferrer"
                style={{
                  color: "#8fd3ff",
                  textDecoration: "none",
                  borderBottom: "1px solid rgba(143,211,255,0.25)",
                }}
              >
                Nutzungsbedingungen
              </a>{" "}
              und die{" "}
              <a
                href="/privacy"
                target="_blank"
                rel="noreferrer"
                style={{
                  color: "#8fd3ff",
                  textDecoration: "none",
                  borderBottom: "1px solid rgba(143,211,255,0.25)",
                }}
              >
                Datenschutzerklärung
              </a>
              .
            </span>
          </label>
        </div>

        <div
          style={{
            marginBottom: 18,
            padding: "16px 18px",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 16,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.025))",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
            opacity:
              browserBlockedUntil && browserBlockedUntil > Date.now() ? 0.6 : 1,
          }}
        >
          <div
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.84)",
              marginBottom: 12,
              lineHeight: 1.5,
            }}
          >
            Sicherheitsprüfung
          </div>

          {siteKey ? (
            <div
              className="cf-turnstile"
              data-sitekey={siteKey}
              data-theme="dark"
              data-callback="onTurnstileSuccess"
              data-expired-callback="onTurnstileExpired"
              data-error-callback="onTurnstileError"
            />
          ) : (
            <div
              style={{
                color: "rgba(255,255,255,0.6)",
                fontSize: 14,
                lineHeight: 1.5,
              }}
            >
              Turnstile ist noch nicht konfiguriert.
            </div>
          )}

          <div
            style={{
              marginTop: 10,
              fontSize: 13,
              color: turnstileToken
                ? "rgba(67,227,139,0.95)"
                : "rgba(255,255,255,0.5)",
            }}
          >
            {turnstileToken
              ? "Sicherheitsprüfung erfolgreich."
              : turnstileReady
              ? "Bitte bestätige die Sicherheitsprüfung."
              : "Sicherheitsprüfung wird geladen..."}
          </div>
        </div>

        {browserLimitMessage ? <div className="error-box">{browserLimitMessage}</div> : null}
        {error ? <div className="error-box">{error}</div> : null}

        <button
          type="submit"
          className="primary-button"
          disabled={
            loading || Boolean(browserBlockedUntil && browserBlockedUntil > Date.now())
          }
        >
          {loading
            ? "Analyse läuft..."
            : browserBlockedUntil && browserBlockedUntil > Date.now()
            ? "Heute bereits genutzt"
            : "Identität prüfen"}
        </button>
      </form>
    </>
  );
}