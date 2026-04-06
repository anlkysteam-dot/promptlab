import Link from "next/link";

type Props = {
  message: string;
  locale?: "tr" | "en";
};

/**
 * Hata metnine göre kısa yönlendirme bağlantıları (Premium, Groq, giriş vb.).
 */
export function WorkbenchErrorCta({ message, locale = "tr" }: Props) {
  const m = message.toLowerCase();

  const creditsHref = locale === "en" ? "/en/credits" : "/tr/kredi";

  const showPremium =
    m.includes("ücretsiz limit") || m.includes("premium") || m.includes("429") || m.includes("kredi");
  const showGroq = m.includes("groq");
  const showOpenAiBilling = m.includes("openai") && (m.includes("kota") || m.includes("faturalama"));
  const showDb = m.includes("veritabanı") || m.includes("prisma");
  const showAuth = m.includes("giriş yap") || (m.includes("giriş") && m.includes("ödeme"));

  if (!showPremium && !showGroq && !showOpenAiBilling && !showDb && !showAuth) return null;

  return (
    <ul className="mt-3 list-none space-y-2 border-t border-[var(--warn-border)] pt-3 text-xs text-[var(--warn-fg)]">
      {showPremium ? (
        <li>
          →{" "}
          <Link href="/pricing" className="font-medium text-[var(--accent)] underline hover:no-underline">
            Premium ve limitler
          </Link>
        </li>
      ) : null}
      {showPremium ? (
        <li>
          →{" "}
          <Link href={creditsHref} className="font-medium text-[var(--accent)] underline hover:no-underline">
            {locale === "en" ? "Buy credit packs" : "Kredi paketi satın al"}
          </Link>
        </li>
      ) : null}
      {showAuth ? (
        <li>
          →{" "}
          <Link href="/auth" className="font-medium text-[var(--accent)] underline hover:no-underline">
            Giriş / kayıt
          </Link>
        </li>
      ) : null}
      {showGroq ? (
        <li>
          → Groq anahtarı ve limit:{" "}
          <a
            href="https://console.groq.com"
            className="font-medium text-[var(--accent)] underline hover:no-underline"
            target="_blank"
            rel="noreferrer"
          >
            console.groq.com
          </a>
        </li>
      ) : null}
      {showOpenAiBilling ? (
        <li>
          → OpenAI faturalama:{" "}
          <a
            href="https://platform.openai.com/settings/organization/billing"
            className="font-medium text-[var(--accent)] underline hover:no-underline"
            target="_blank"
            rel="noreferrer"
          >
            platform.openai.com
          </a>
        </li>
      ) : null}
      {showDb ? (
        <li>→ Geliştirici: proje kökünde <code className="rounded bg-[var(--code-bg)] px-1">npx prisma db push</code></li>
      ) : null}
    </ul>
  );
}
