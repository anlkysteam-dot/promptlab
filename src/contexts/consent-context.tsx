"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const STORAGE_KEY = "promptlab_cookie_consent";

export type CookieConsent = "pending" | "essential" | "analytics";

type Ctx = {
  consent: CookieConsent;
  setEssential: () => void;
  setAnalytics: () => void;
};

const ConsentContext = createContext<Ctx | null>(null);

function readStored(): CookieConsent {
  if (typeof window === "undefined") return "pending";
  const v = localStorage.getItem(STORAGE_KEY);
  if (v === "essential" || v === "analytics") return v;
  return "pending";
}

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<CookieConsent>("pending");

  useEffect(() => {
    setConsent(readStored());
  }, []);

  const setEssential = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "essential");
    setConsent("essential");
  }, []);

  const setAnalytics = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "analytics");
    setConsent("analytics");
  }, []);

  const value = useMemo(() => ({ consent, setEssential, setAnalytics }), [consent, setEssential, setAnalytics]);

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error("useConsent must be used within ConsentProvider");
  return ctx;
}
