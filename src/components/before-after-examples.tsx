const EXAMPLES = [
  {
    name: "Hüseyin Ş.",
    user: "LinkedIn’de paylaşmak için kısa bir kariyer tavsiyesi yazısı; motive edici ama abartısız.",
    prompt:
      "Write a concise LinkedIn post (under 200 words) offering one practical career tip for junior developers. Tone: encouraging, professional, no hype or buzzwords. End with a soft call to comment.",
  },
  {
    name: "Deniz A.",
    user: "Python ile CSV dosyasından okuyup özet istatistik basan küçük bir script iskeleti.",
    prompt:
      "You are a Python tutor. Provide a minimal script skeleton that: reads a CSV with pandas, prints row count, column names, and basic describe() stats, with brief comments. Use type hints where helpful.",
  },
  {
    name: "Turan D.",
    user: "Çocuklar için 8 yaşında bir doğum günü davetiyesi metni; neşeli ve kısa.",
    prompt:
      "Draft a short birthday party invitation message for parents to send via WhatsApp, child turning 8, playful tone, Turkish cultural context OK in vibe but output the invitation text in English for an international school setting.",
  },
];

export function BeforeAfterExamples() {
  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
      <h2 className="text-sm font-semibold text-[var(--text)]">Nasıl çalışıyor?</h2>
      <p className="mt-1 text-xs text-[var(--muted)]">
        Sen istediğin dilde yazarsın; PromptLab seçtiğin araca uygun, düzgün bir prompt üretir.
      </p>
      <ul className="mt-4 flex flex-col gap-4">
        {EXAMPLES.map((ex, i) => (
          <li key={i} className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4">
            <p className="text-sm font-semibold text-[var(--text)]">{ex.name}</p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{ex.user}</p>
            <div className="my-3 h-px bg-[var(--border)]" />
            <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--brand-lab)]">PromptLab üretti (özet)</p>
            <p className="mt-1 font-mono text-xs leading-relaxed text-[var(--muted)] line-clamp-4 sm:line-clamp-none">{ex.prompt}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
