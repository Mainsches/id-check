"use client";

import Script from "next/script";
import { FormEvent, useEffect, useState } from "react";
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


const LOADING_MESSAGES = [
  "Analysiere öffentliche Daten...",
  "Suche nach Plattform-Signalen...",
  "Berechne Risiko...",
  "Erstelle deine Auswertung...",
];

type FieldErrorKey = "firstName" | "lastName" | "city";

export default function ScanForm({ onResult }: ScanFormProps) {
  const [formData, setFormData] = useState<ScanRequestBody>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldErrorKey, string>>>(
    {}
  );
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [confirmOwnership, setConfirmOwnership] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReady, setTurnstileReady] = useState(false);
  const [formStartedAt] = useState<number>(Date.now());
  const [honeypot, setHoneypot] = useState("");
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

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
    if (!loading) {
      setLoadingMessageIndex(0);
      return;
    }

    const id = window.setInterval(() => {
      setLoadingMessageIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 2600);

    return () => window.clearInterval(id);
  }, [loading]);

  const inputsDisabled = loading;

  function clearFieldError(key: FieldErrorKey) {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function updateField<K extends keyof ScanRequestBody>(
    key: K,
    value: ScanRequestBody[K]
  ) {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
    if (key === "firstName" || key === "lastName" || key === "city") {
      clearFieldError(key);
    }
  }

  function validateFields(): boolean {
    const next: Partial<Record<FieldErrorKey, string>> = {};
    const fn = formData.firstName.trim();
    const ln = formData.lastName.trim();
    const city = (formData.city ?? "").trim();

    if (!fn) {
      next.firstName = "Bitte gib deinen Vornamen ein";
    }
    if (!ln) {
      next.lastName = "Bitte gib deinen Nachnamen ein";
    }
    if (!city) {
      next.city = "Bitte gib eine Stadt ein";
    }

    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setFieldErrors({});

    if (honeypot.trim()) {
      setError("Anfrage blockiert.");
      return;
    }

    if (!validateFields()) {
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
          honeypot,
          formStartedAt,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || "Beim Scan ist ein Fehler aufgetreten.");
        return;
      }

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

      <form
        className="scan-form scan-form-v2 fade-in"
        onSubmit={handleSubmit}
        aria-busy={loading}
      >
        <div className="form-intro">
          <span className="eyebrow">ID Radar</span>
          <h1>Wie sichtbar ist deine Identität online?</h1>
          <p>
            Prüfe öffentliche Spuren, mögliche Profil-Treffer und erkennbare
            Verknüpfungen deiner Identität im Internet.
          </p>
        </div>

        <div
          style={{
            position: "absolute",
            left: "-9999px",
            width: 1,
            height: 1,
            overflow: "hidden",
            opacity: 0,
            pointerEvents: "none",
          }}
          aria-hidden="true"
        >
          <label htmlFor="website">Website</label>
          <input
            id="website"
            type="text"
            name="website"
            autoComplete="off"
            tabIndex={-1}
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </div>

        <fieldset className="scan-form-fieldset scan-form-fieldset--name">
          <legend className="scan-form-legend">Vollständiger Name</legend>
          <div className="form-grid form-grid--scan-name">
            <div className="field">
              <label htmlFor="firstName">Vorname</label>
              <input
                id="firstName"
                type="text"
                name="firstName"
                autoComplete="given-name"
                placeholder="z. B. Max"
                value={formData.firstName}
                onChange={(e) => updateField("firstName", e.target.value)}
                disabled={inputsDisabled}
                aria-invalid={Boolean(fieldErrors.firstName)}
                aria-describedby={fieldErrors.firstName ? "err-firstName" : undefined}
              />
              {fieldErrors.firstName ? (
                <p id="err-firstName" className="field-error" role="alert">
                  {fieldErrors.firstName}
                </p>
              ) : null}
            </div>

            <div className="field">
              <label htmlFor="lastName">Nachname</label>
              <input
                id="lastName"
                type="text"
                name="lastName"
                autoComplete="family-name"
                placeholder="z. B. Mustermann"
                value={formData.lastName}
                onChange={(e) => updateField("lastName", e.target.value)}
                disabled={inputsDisabled}
                aria-invalid={Boolean(fieldErrors.lastName)}
                aria-describedby={fieldErrors.lastName ? "err-lastName" : undefined}
              />
              {fieldErrors.lastName ? (
                <p id="err-lastName" className="field-error" role="alert">
                  {fieldErrors.lastName}
                </p>
              ) : null}
            </div>
          </div>
        </fieldset>

        <div className="form-grid">
          <div className="field field-full">
            <label htmlFor="city">Stadt</label>
            <input
              id="city"
              type="text"
              name="city"
              autoComplete="address-level2"
              placeholder="z. B. Zürich"
              value={formData.city}
              onChange={(e) => updateField("city", e.target.value)}
              disabled={inputsDisabled}
              aria-invalid={Boolean(fieldErrors.city)}
              aria-describedby={fieldErrors.city ? "err-city" : undefined}
            />
            {fieldErrors.city ? (
              <p id="err-city" className="field-error" role="alert">
                {fieldErrors.city}
              </p>
            ) : null}
          </div>

          <div className="field field-full field-optional-soft">
            <div className="field-label-row">
              <label htmlFor="username">Username</label>
              <span className="field-optional-badge">Optional</span>
            </div>
            <input
              id="username"
              type="text"
              name="username"
              autoComplete="username"
              placeholder="z. B. maxmustermann"
              value={formData.username}
              onChange={(e) => updateField("username", e.target.value)}
              disabled={inputsDisabled}
            />
            <p className="field-hint">optional – erhöht Genauigkeit</p>
          </div>

          <div className="field field-full field-optional-soft">
            <div className="field-label-row">
              <label htmlFor="email">E-Mail</label>
              <span className="field-optional-badge">Optional</span>
            </div>
            <input
              id="email"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="z. B. mail@example.com"
              value={formData.email}
              onChange={(e) => updateField("email", e.target.value)}
              disabled={inputsDisabled}
            />
          </div>
        </div>

        <div className="scan-form-trust-micro" aria-live="polite">
          <p>Wir speichern keine persönlichen Daten</p>
          <p>Analyse basiert nur auf öffentlich sichtbaren Informationen</p>
        </div>

        <div className="privacy-box privacy-box--compact">
          <p>
            Deine Eingaben werden nur für diese Anfrage verarbeitet und nicht als
            dauerhaftes Profil gespeichert.
          </p>
        </div>

        <div className="scan-form-consent">
          <label className="scan-form-consent-label">
            <input
              type="checkbox"
              checked={confirmOwnership}
              onChange={(e) => setConfirmOwnership(e.target.checked)}
              disabled={inputsDisabled}
            />
            <span>
              Ich bestätige, dass ich meine eigenen Daten prüfe oder zur
              Durchführung dieser Suche berechtigt bin.
            </span>
          </label>

          <label className="scan-form-consent-label">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              disabled={inputsDisabled}
            />
            <span>
              Ich akzeptiere die{" "}
              <a href="/terms" target="_blank" rel="noreferrer">
                Nutzungsbedingungen
              </a>{" "}
              und die{" "}
              <a href="/privacy" target="_blank" rel="noreferrer">
                Datenschutzerklärung
              </a>
              .
            </span>
          </label>
        </div>

        <div className="scan-form-turnstile">
          <div className="scan-form-turnstile-title">Sicherheitsprüfung</div>

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
            <div className="scan-form-turnstile-fallback">
              Turnstile ist noch nicht konfiguriert.
            </div>
          )}

          <div
            className={`scan-form-turnstile-status ${
              turnstileToken ? "is-ok" : ""
            }`}
          >
            {turnstileToken
              ? "Sicherheitsprüfung erfolgreich."
              : turnstileReady
                ? "Bitte bestätige die Sicherheitsprüfung."
                : "Sicherheitsprüfung wird geladen..."}
          </div>
        </div>

        {error ? <div className="error-box">{error}</div> : null}

        <div className="scan-form-submit-block">
          {loading ? (
            <div className="scan-form-loading" role="status" aria-live="polite">
              <div className="scan-form-spinner" aria-hidden="true" />
              <p className="scan-form-loading-text">
                {LOADING_MESSAGES[loadingMessageIndex]}
              </p>
            </div>
          ) : (
            <>
              <button
                type="submit"
                className="primary-button scan-form-cta"
                disabled={loading}
              >
                Identität prüfen
              </button>
              <p className="scan-form-cta-sub">Kostenlos · 1 Scan pro Tag</p>
            </>
          )}
        </div>
      </form>
    </>
  );
}
