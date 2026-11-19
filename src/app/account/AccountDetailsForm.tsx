
"use client";

import { useState } from "react";

type Props = {
  name: string;
  email: string;
  phone: string;
};

export default function AccountDetailsForm({
  name,
  email,
  phone
}: Props) {
  const [form, setForm] = useState({ name, email, phone });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError(false);

    try {
      const response = await fetch("/api/account/details", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not save your details.");
      }

      setForm({
        name: data.customer.name || "",
        email: data.customer.email || "",
        phone: data.customer.phone || ""
      });

      setMessage("Your details have been saved.");
    } catch (err) {
      setError(true);
      setMessage(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="accountDetailsForm" onSubmit={handleSubmit}>
      <label>
        FULL NAME
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
      </label>

      <label>
        EMAIL ADDRESS
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
      </label>

      <label>
        PHONE NUMBER
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
      </label>

      <button type="submit" disabled={saving}>
        {saving ? "SAVING..." : "SAVE MY DETAILS"}
      </button>

      {message && (
        <p className={error ? "accountFormError" : "accountFormSuccess"}>
          {message}
        </p>
      )}
    </form>
  );
}
