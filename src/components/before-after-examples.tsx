type UiLocale = "tr" | "en";

type Example = {
  name: string;
  user: string;
  prompt: string;
};

const EXAMPLES_TR: Example[] = [
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

const EXAMPLES_EN: Example[] = [
  {
    name: "Hüseyin Ş.",
    user: "A short career-advice post for LinkedIn—motivating but not over the top.",
    prompt:
      "Write a concise LinkedIn post (under 200 words) offering one practical career tip for junior developers. Tone: encouraging, professional, no hype or buzzwords. End with a soft call to comment.",
  },
  {
    name: "Deniz A.",
    user: "A small Python script skeleton that reads a CSV and prints summary statistics.",
    prompt:
      "You are a Python tutor. Provide a minimal script skeleton that: reads a CSV with pandas, prints row count, column names, and basic describe() stats, with brief comments. Use type hints where helpful.",
  },
  {
    name: "Turan D.",
    user: "A birthday invitation message for kids turning 8—cheerful and short.",
    prompt:
      "Draft a short birthday party invitation message for parents to send via WhatsApp, child turning 8, playful tone, Turkish cultural context OK in vibe but output the invitation text in English for an international school setting.",
  },
];

const COPY: Record<
  UiLocale,
  { title: string; subtitle: string; producedLabel: string }
> = {
  tr: {
    title: "Nasıl çalışıyor?",
    subtitle:
      "Sen istediğin dilde yazarsın; PromptLab seçtiğin araca uygun, düzgün bir prompt üretir.",
    producedLabel: "PromptLab üretti (özet)",
  },
  en: {
    title: "How it works",
    subtitle:
      "Write in your own words; PromptLab turns it into a clean prompt for the tool you pick.",
    producedLabel: "PromptLab output (summary)",
  },
};

export function BeforeAfterExamples({ locale = "tr" }: { locale?: UiLocale }) {
  const isEn = locale === "en";
  const t = COPY[isEn ? "en" : "tr"];
  const examples = isEn ? EXAMPLES_EN : EXAMPLES_TR;

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
      <h2 className="text-sm font-semibold text-[var(--text)]">{t.title}</h2>
      <p className="mt-1 text-xs text-[var(--muted)]">{t.subtitle}</p>
      <ul className="mt-4 flex flex-col gap-4">
        {examples.map((ex, i) => (
          <li key={i} className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4">
            <p className="text-sm font-semibold text-[var(--text)]">{ex.name}</p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{ex.user}</p>
            <div className="my-3 h-px bg-[var(--border)]" />
            <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--brand-lab)]">{t.producedLabel}</p>
            <p className="mt-1 font-mono text-xs leading-relaxed text-[var(--muted)] line-clamp-4 sm:line-clamp-none">{ex.prompt}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
