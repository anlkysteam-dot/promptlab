"use client";

import { useState } from "react";

export function AboutFeedbackForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const r = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, message }),
      });
      const j = (await r.json()) as { error?: string };
      if (!r.ok) {
        setErr(j.error ?? "Gönderilemedi.");
        return;
      }
      setDone(true);
      setMessage("");
    } catch {
      setErr("Ağ hatası. Bağlantınızı kontrol edin.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <p className="rounded-lg border border-[var(--success-border)] bg-[var(--success-bg)] px-4 py-3 text-sm text-[var(--success-fg)]">
        Teşekkürler. Geri bildiriminiz alındı.
      </p>
    );
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="mt-4 space-y-4">
      <div>
        <label htmlFor="fb-email" className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
          E-posta
        </label>
        <input
          id="fb-email"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
          placeholder="ornek@eposta.com"
        />
      </div>
      <div>
        <label htmlFor="fb-msg" className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
          Mesajınız
        </label>
        <textarea
          id="fb-msg"
          name="message"
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="mt-2 w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
          placeholder="Düşüncelerinizi, önerilerinizi veya yaşadığınız sorunu yazın."
        />
      </div>
      {err ? (
        <p className="text-sm text-[var(--err-fg)]">{err}</p>
      ) : null}
      <button
        type="submit"
        disabled={busy}
        className="rounded-lg border border-[var(--accent)] bg-[var(--accent-dim)] px-4 py-2.5 text-sm font-semibold text-[var(--text)] hover:opacity-95 disabled:opacity-40"
      >
        {busy ? "Gönderiliyor…" : "Geri bildirim gönder"}
      </button>
    </form>
  );
}
