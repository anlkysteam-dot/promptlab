"use client";

type UiLocale = "tr" | "en";

export function WorkbenchShortcutsModal({
  open,
  onClose,
  locale = "tr",
}: {
  open: boolean;
  onClose: () => void;
  locale?: UiLocale;
}) {
  const isEn = locale === "en";
  const tx = (tr: string, en: string) => (isEn ? en : tr);

  if (!open) return null;

  const rows: { keys: string; desc: string }[] = [
    {
      keys: "Ctrl + Enter",
      desc: tx("Metin kutusundayken formu gönder", "Submit the form while the text area is focused"),
    },
    {
      keys: "?",
      desc: tx("Klavye kısayollarını aç / kapat", "Toggle this shortcuts panel"),
    },
    {
      keys: "Esc",
      desc: tx("Bu pencereyi kapat", "Close this panel"),
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[var(--scrim)] p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
      onClick={onClose}
    >
      <div
        className="max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="shortcuts-title" className="text-lg font-semibold text-[var(--text)]">
          {tx("Klavye kısayolları", "Keyboard shortcuts")}
        </h2>
        <ul className="mt-4 space-y-3">
          {rows.map((row) => (
            <li key={row.keys} className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
              <kbd className="shrink-0 rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1 font-mono text-xs text-[var(--text)]">
                {row.keys}
              </kbd>
              <span className="text-sm text-[var(--muted)]">{row.desc}</span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-lg border border-[var(--border)] py-2 text-sm text-[var(--text)] hover:bg-[var(--hover-surface)]"
        >
          {tx("Kapat", "Close")}
        </button>
      </div>
    </div>
  );
}
