"use client";

import { useState } from "react";

export function AdminManualCreditsForm() {
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("50");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setBusy(true);
    try {
      const r = await fetch("/api/admin/manual-credits", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          amount: Number(amount),
          note: note.trim(),
        }),
      });
      const j = (await r.json()) as { error?: string; creditBalanceAfter?: number; ok?: boolean };
      if (!r.ok) {
        setErr(j.error ?? "Hata");
        return;
      }
      setMsg(`Eklendi. Yeni bakiye: ${j.creditBalanceAfter ?? "—"}`);
      setNote("");
    } catch {
      setErr("Ağ hatası.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="mt-4 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-[var(--muted)]">Kullanıcı e-postası (kayıtlı)</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
            placeholder="kullanici@ornek.com"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--muted)]">Eklenecek kredi</label>
          <input
            type="number"
            min={1}
            max={500000}
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-[var(--muted)]">Not (isteğe bağlı)</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
          placeholder="Ödeme alındı, webhook hatası vb."
        />
      </div>
      {err ? <p className="text-sm text-[var(--err-fg)]">{err}</p> : null}
      {msg ? <p className="text-sm text-[var(--success-fg)]">{msg}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="rounded-lg border border-[var(--accent)] bg-[var(--accent-dim)] px-4 py-2 text-sm font-semibold text-[var(--text)] disabled:opacity-40"
      >
        {busy ? "İşleniyor…" : "Kredi ekle"}
      </button>
    </form>
  );
}
