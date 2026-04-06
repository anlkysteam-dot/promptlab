"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "promptlab_onboarding_v2";

type UiLocale = "tr" | "en";

type Step = {
  title: string;
  body: string;
  focusId?: string;
};

const STEPS_TR: Step[] = [
  {
    title: "Hoş geldin",
    body: "PromptLab ile isteğini yazıp, seçtiğin yapay zeka aracına uygun profesyonel prompt üretebilirsin.",
  },
  {
    title: "Profil ve geçmiş",
    body: "Son üretimler artık ana sayfada değil: üstteki Profilim’den geçmişine, favorilere ve Keşfet paylaşımına ulaşırsın; çıkış da orada.",
    focusId: "tour-profile",
  },
  {
    title: "Hızlı başlat",
    body: "Kategorilere tıklayıp hazır örneklerle formu doldurabilirsin.",
    focusId: "tour-quick-start",
  },
  {
    title: "Ne istiyorsun?",
    body: "Asıl isteğini buraya yaz. Uzman modda hedef modeli ve Lab ayarlarını açabilirsin.",
    focusId: "workbench-intent",
  },
  {
    title: "Üret",
    body: "Bu düğmeyle promptunu oluştur; sonucu kopyalayıp ChatGPT veya video/görsel aracına yapıştır.",
    focusId: "tour-submit",
  },
];

const STEPS_EN: Step[] = [
  {
    title: "Welcome",
    body: "PromptLab turns your request into a ready-to-use prompt for the AI tool you pick.",
  },
  {
    title: "Profile & history",
    body: "Recent generations moved off the home screen: use My profile in the header for history, favorites, Discover sharing, and sign out.",
    focusId: "tour-profile",
  },
  {
    title: "Quick start",
    body: "Click a category to fill the form with rotating samples.",
    focusId: "tour-quick-start",
  },
  {
    title: "What do you want?",
    body: "Write your real request here. In expert mode you can pick the target model and Lab options.",
    focusId: "workbench-intent",
  },
  {
    title: "Generate",
    body: "Create your prompt, then copy it into ChatGPT or your video/image tool.",
    focusId: "tour-submit",
  },
];

export function WorkbenchOnboarding({ locale = "tr" }: { locale?: UiLocale }) {
  const steps = useMemo(() => (locale === "en" ? STEPS_EN : STEPS_TR), [locale]);
  const labels =
    locale === "en"
      ? { tour: "Tour", skip: "Skip", next: "Next", finish: "Done" }
      : { tour: "Tur", skip: "Atla", next: "İleri", finish: "Bitir" };

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      return;
    }
    setOpen(true);
  }, []);

  if (!open) return null;

  const current = steps[step] ?? steps[0];

  function finish() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setOpen(false);
  }

  function next() {
    if (step < steps.length - 1) {
      const nextStep = step + 1;
      setStep(nextStep);
      const focus = steps[nextStep]?.focusId;
      if (focus && typeof document !== "undefined") {
        window.setTimeout(() => {
          document.getElementById(focus)?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 120);
      }
    } else {
      finish();
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-[var(--scrim)] p-4 sm:items-center" role="dialog">
      <div className="max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xl">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
          {labels.tour} {step + 1}/{steps.length}
        </p>
        <h2 className="mt-2 text-lg font-semibold text-[var(--text)]">{current.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{current.body}</p>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={finish}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--muted)] hover:text-[var(--text)]"
          >
            {labels.skip}
          </button>
          <button
            type="button"
            onClick={next}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--on-accent)]"
          >
            {step < steps.length - 1 ? labels.next : labels.finish}
          </button>
        </div>
      </div>
    </div>
  );
}
