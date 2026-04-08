"use client";

import { FormEvent, useState } from "react";
import { ScanRequestBody, ScanResponse } from "@/types/scan";

type ScanFormProps = {
  onResult: (result: ScanResponse) => void;
};

const initialState: ScanRequestBody = {
  firstName: "",
  lastName: "",
  city: "",
  username: "",
  email: "",
};

export default function ScanForm({ onResult }: ScanFormProps) {
  const [formData, setFormData] = useState<ScanRequestBody>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateField<K extends keyof ScanRequestBody>(key: K, value: ScanRequestBody[K]) {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || "Something went wrong during the scan.");
        return;
      }

      onResult(data as ScanResponse);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="scan-form fade-in" onSubmit={handleSubmit}>
      <div className="form-intro">
        <span className="eyebrow">AI Identity Risk Scanner</span>
        <h1>Is your identity at risk?</h1>
        <p>
          Enter your basic identity signals. The MVP simulates web visibility,
          social profile discovery, and possible email leak exposure.
        </p>
      </div>

      <div className="form-grid">
        <div className="field">
          <label htmlFor="firstName">First name</label>
          <input
            id="firstName"
            type="text"
            placeholder="John"
            value={formData.firstName}
            onChange={(e) => updateField("firstName", e.target.value)}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="lastName">Last name</label>
          <input
            id="lastName"
            type="text"
            placeholder="Doe"
            value={formData.lastName}
            onChange={(e) => updateField("lastName", e.target.value)}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="city">City <span className="optional">(optional)</span></label>
          <input
            id="city"
            type="text"
            placeholder="Zurich"
            value={formData.city}
            onChange={(e) => updateField("city", e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="username">Username <span className="optional">(optional)</span></label>
          <input
            id="username"
            type="text"
            placeholder="john.doe89"
            value={formData.username}
            onChange={(e) => updateField("username", e.target.value)}
          />
        </div>

        <div className="field field-full">
          <label htmlFor="email">Email <span className="optional">(optional)</span></label>
          <input
            id="email"
            type="email"
            placeholder="john@example.com"
            value={formData.email}
            onChange={(e) => updateField("email", e.target.value)}
          />
        </div>
      </div>

      <div className="privacy-box">
        <p>
          No login. No database. No personal data is stored. Inputs are processed
          only within the request and returned as a temporary result.
        </p>
      </div>

      {error ? <div className="error-box">{error}</div> : null}

      <button type="submit" className="primary-button" disabled={loading}>
        {loading ? "Scanning..." : "Scan my identity"}
      </button>
    </form>
  );
}