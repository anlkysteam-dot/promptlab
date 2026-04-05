"use client";

import Script from "next/script";
import { useConsent } from "@/contexts/consent-context";

/**
 * Yalnızca kullanıcı "Çerezleri kabul et" dediğinde yüklenir.
 * .env: NEXT_PUBLIC_PLAUSIBLE_DOMAIN ve/veya NEXT_PUBLIC_GA_MEASUREMENT_ID
 */
export function AnalyticsScripts() {
  const { consent } = useConsent();
  if (consent !== "analytics") return null;

  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN?.trim();
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();

  return (
    <>
      {plausibleDomain ? (
        <Script
          defer
          data-domain={plausibleDomain}
          src="https://plausible.io/js/script.js"
          strategy="afterInteractive"
        />
      ) : null}
      {gaId ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', ${JSON.stringify(gaId)}, { anonymize_ip: true });
            `}
          </Script>
        </>
      ) : null}
    </>
  );
}
