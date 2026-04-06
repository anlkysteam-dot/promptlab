"use client";

import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";
import { AnalyticsScripts } from "@/components/analytics-scripts";
import { CookieBanner } from "@/components/cookie-banner";
import { ConsentProvider } from "@/contexts/consent-context";
import { ThemeProvider } from "@/contexts/theme-context";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <ThemeProvider>
        <ConsentProvider>
          {children}
          <CookieBanner />
          <AnalyticsScripts />
        </ConsentProvider>
      </ThemeProvider>
    </ClerkProvider>
  );
}
