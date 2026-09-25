"use client";

import { useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  const [devEmail, setDevEmail] = useState("");
  const [devPassword, setDevPassword] = useState("");
  const [devStatus, setDevStatus] = useState<"idle" | "sending" | "error">("idle");
  const [devMessage, setDevMessage] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setMessage("");

    const supabase = createSupabaseBrowserClient();
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${siteUrl}/auth/callback` },
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
    } else {
      setStatus("sent");
      setMessage("أرسلنا رابط تسجيل الدخول إلى بريدك الإلكتروني.");
    }
  }

  /**
   * Password sign-in — a faster path for repeated logins during development,
   * so you don't have to wait for a magic-link email every time. Requires a
   * password to already be set for the account (see the SQL script). Safe to
   * leave in place after development: it's a normal Supabase auth method,
   * not a bypass, and only works for an account that has a password set.
   */
  async function handleDevSubmit(e: FormEvent) {
    e.preventDefault();
    setDevStatus("sending");
    setDevMessage("");

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: devEmail,
      password: devPassword,
    });

    if (error) {
      setDevStatus("error");
      setDevMessage(error.message);
    } else {
      window.location.href = "/";
    }
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f8fb",
        fontFamily: "Tajawal, system-ui, sans-serif",
        padding: 20,
      }}
    >
      <div
        style={{
          background: "#fff",
          border: "1px solid #e6edf1",
          borderRadius: 18,
          padding: 32,
          maxWidth: 380,
          width: "100%",
          boxShadow: "0 14px 34px rgba(18,60,80,.12)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 26 }}>
          <span
            style={{
              height: 38,
              width: 38,
              flex: "none",
              borderRadius: 12,
              background: "#d6f7f2",
              color: "#103a4a",
              fontWeight: 800,
              fontSize: 22,
              display: "grid",
              placeItems: "center",
            }}
          >
            A
          </span>
          <div>
            <strong style={{ display: "block", fontSize: 18, color: "#12263d" }}>
              أكاديمية AI
            </strong>
            <small style={{ color: "#677d8d" }}>تسجيل الدخول</small>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <label
            htmlFor="email"
            style={{ display: "block", fontWeight: 700, marginBottom: 8, color: "#344f60", fontSize: 14 }}
          >
            البريد الإلكتروني للعمل
          </label>
          <input
            id="email"
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@opentech.ae"
            style={{
              width: "100%",
              border: "1px solid #cfdee5",
              borderRadius: 9,
              padding: 12,
              marginBottom: 16,
              fontSize: 15,
              fontFamily: "inherit",
            }}
          />
          <button
            type="submit"
            disabled={status === "sending"}
            style={{
              width: "100%",
              border: 0,
              borderRadius: 10,
              padding: "13px 18px",
              fontWeight: 800,
              background: "#53cfbd",
              color: "#0b3240",
              fontSize: 15,
              cursor: status === "sending" ? "not-allowed" : "pointer",
              opacity: status === "sending" ? 0.7 : 1,
            }}
          >
            {status === "sending" ? "جارٍ الإرسال…" : "إرسال رابط الدخول"}
          </button>
        </form>

        {message && (
          <p
            style={{
              marginTop: 16,
              color: status === "error" ? "#935427" : "#166c4e",
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            {message}
          </p>
        )}

        <div
          style={{
            margin: "22px 0 16px",
            borderTop: "1px solid #e6edf1",
            paddingTop: 16,
          }}
        >
          <small style={{ display: "block", color: "#8398a8", marginBottom: 12 }}>
            دخول سريع بكلمة المرور (لمرحلة التطوير فقط)
          </small>

          <form onSubmit={handleDevSubmit}>
            <label
              htmlFor="devEmail"
              style={{ display: "block", fontWeight: 700, marginBottom: 8, color: "#344f60", fontSize: 14 }}
            >
              البريد الإلكتروني
            </label>
            <input
              id="devEmail"
              required
              type="email"
              value={devEmail}
              onChange={(e) => setDevEmail(e.target.value)}
              placeholder="name@opentech.ae"
              style={{
                width: "100%",
                border: "1px solid #cfdee5",
                borderRadius: 9,
                padding: 12,
                marginBottom: 12,
                fontSize: 15,
                fontFamily: "inherit",
              }}
            />
            <label
              htmlFor="devPassword"
              style={{ display: "block", fontWeight: 700, marginBottom: 8, color: "#344f60", fontSize: 14 }}
            >
              كلمة المرور
            </label>
            <input
              id="devPassword"
              required
              type="password"
              value={devPassword}
              onChange={(e) => setDevPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: "100%",
                border: "1px solid #cfdee5",
                borderRadius: 9,
                padding: 12,
                marginBottom: 14,
                fontSize: 15,
                fontFamily: "inherit",
              }}
            />
            <button
              type="submit"
              disabled={devStatus === "sending"}
              style={{
                width: "100%",
                border: "1px solid #dbe5e9",
                borderRadius: 10,
                padding: "13px 18px",
                fontWeight: 800,
                background: "#fff",
                color: "#19516a",
                fontSize: 15,
                cursor: devStatus === "sending" ? "not-allowed" : "pointer",
                opacity: devStatus === "sending" ? 0.7 : 1,
              }}
            >
              {devStatus === "sending" ? "جارٍ الدخول…" : "دخول سريع"}
            </button>
          </form>

          {devMessage && (
            <p style={{ marginTop: 12, color: "#935427", fontSize: 14, lineHeight: 1.6 }}>
              {devMessage}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
