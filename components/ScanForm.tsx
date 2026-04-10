"use client";

import { FormEvent, useState } from "react";
import { ScanRequestBody, ScanResponse } from "@/types/scan";

type Props = {
  onResult: (result: ScanResponse) => void;
};

const initialState: ScanRequestBody = {
  firstName: "",
  lastName: "",
  city: "",
  username: "",
  email: "",
};

export default function ScanForm({ onResult }: Props) {
  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [accept, setAccept] = useState(false);
  const [confirm, setConfirm] = useState(false);

  function updateField<K extends keyof ScanRequestBody>(
    key: K,
    value: ScanRequestBody[K]
  ) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!confirm) {
      setError("Bitte bestätige, dass du deine eigenen Daten prüfst.");
      return;
    }

    if (!accept) {
      setError("Bitte akzeptiere die Datenschutzbestimmungen und AGB.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError("Fehler beim Scan.");
        return;
      }

      onResult(data);
    } catch {
      setError("Netzwerkfehler.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="scan-form fade-in" onSubmit={handleSubmit}>
      <div className="form-intro">
        <span className="eyebrow">ID Radar</span>
        <h1>Wie sichtbar ist deine Identität im Internet?</h1>
        <p>
          Analysiere öffentliche Daten, Profile und mögliche Verknüpfungen deiner
          Identität.
        </p>
      </div>

      <div className="form-grid">
        <input
          placeholder="Vorname"
          value={formData.firstName}
          onChange={(e) => updateField("firstName", e.target.value)}
          required
        />
        <input
          placeholder="Nachname"
          value={formData.lastName}
          onChange={(e) => updateField("lastName", e.target.value)}
          required
        />
        <input
          placeholder="Stadt (optional)"
          value={formData.city}
          onChange={(e) => updateField("city", e.target.value)}
        />
        <input
          placeholder="Username (optional)"
          value={formData.username}
          onChange={(e) => updateField("username", e.target.value)}
        />
        <input
          placeholder="E-Mail (optional)"
          value={formData.email}
          onChange={(e) => updateField("email", e.target.value)}
        />
      </div>

      <div className="checkbox-box">
        <label>
          <input
            type="checkbox"
            checked={confirm}
            onChange={(e) => setConfirm(e.target.checked)}
          />
          Ich bestätige, dass ich meine eigenen Daten prüfe.
        </label>

        <label>
          <input
            type="checkbox"
            checked={accept}
            onChange={(e) => setAccept(e.target.checked)}
          />
          Ich akzeptiere Datenschutz & AGB.
        </label>
      </div>

      {error && <div className="error-box">{error}</div>}

      <button disabled={loading} className="primary-button">
        {loading ? "Scan läuft..." : "Identität analysieren"}
      </button>
    </form>
  );
}