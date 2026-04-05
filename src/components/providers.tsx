"use client";

import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";
import { AnalyticsScripts } from "@/components/analytics-scripts";
import { CookieBanner } from "@/components/cookie-banner";
import { ConsentProvider } from "@/contexts/consent-context";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <ConsentProvider>
        {children}
        <CookieBanner />
        <AnalyticsScripts />
      </ConsentProvider>
    </ClerkProvider>
  );
}
