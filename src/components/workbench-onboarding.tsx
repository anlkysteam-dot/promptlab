"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "promptlab_onboarding_v1";

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

export function WorkbenchOnboarding() {
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

  const current = STEPS_TR[step] ?? STEPS_TR[0];

  function finish() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setOpen(false);
  }

  function next() {
    if (step < STEPS_TR.length - 1) {
      const nextStep = step + 1;
      setStep(nextStep);
      const focus = STEPS_TR[nextStep]?.focusId;
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
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 p-4 sm:items-center" role="dialog">
      <div className="max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xl">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
          Tur {step + 1}/{STEPS_TR.length}
        </p>
        <h2 className="mt-2 text-lg font-semibold text-[var(--text)]">{current.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{current.body}</p>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={finish}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--muted)] hover:text-[var(--text)]"
          >
            Atla
          </button>
          <button
            type="button"
            onClick={next}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-zinc-900"
          >
            {step < STEPS_TR.length - 1 ? "İleri" : "Bitir"}
          </button>
        </div>
      </div>
    </div>
  );
}
