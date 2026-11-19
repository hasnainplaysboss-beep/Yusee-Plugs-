
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={main}>
      <div style={panel}>
        <Link href="/" style={brand}>YUSEE PLUGS</Link>
        <h1 style={heading}>WELCOME BACK.</h1>
        <p>Sign in to your Yusee Plugs account.</p>

        <form onSubmit={submit} style={form}>
          <input required type="email" placeholder="Email address" value={email}
            onChange={e => setEmail(e.target.value)} style={field} />
          <input required type="password" placeholder="Password" value={password}
            onChange={e => setPassword(e.target.value)} style={field} />
          {error && <p style={errorStyle}>{error}</p>}
          <button disabled={loading} style={button}>
            {loading ? "SIGNING IN..." : "SIGN IN"}
          </button>
        </form>

        <p style={{ marginTop: 25 }}>
          New to Yusee? <Link href="/register">Create an account</Link>
        </p>
      </div>
    </main>
  );
}

const main = { minHeight: "100vh", background: "#f5f4f0", padding: "55px 20px", fontFamily: "Arial" };
const panel = { maxWidth: 430, margin: "auto" };
const brand = { color: "#111", textDecoration: "none", fontWeight: 900, letterSpacing: 3 };
const heading = { fontSize: 36, marginTop: 65, letterSpacing: -1 };
const form = { display: "grid", gap: 15, marginTop: 35 };
const field = { padding: 17, border: "1px solid #ccc", background: "white", fontSize: 15, width: "100%", boxSizing: "border-box" as const };
const button = { padding: 18, background: "#111", color: "white", border: 0, fontWeight: 800, cursor: "pointer" };
const errorStyle = { color: "#b00020", fontSize: 14 };
