"use client";

import { useEffect } from "react";

export function AdminFeedbackHashRedirect() {
  useEffect(() => {
    window.location.replace(`${window.location.origin}/admin#geri-bildirim`);
  }, []);

  return (
    <p className="py-12 text-center text-sm text-[var(--muted)]">Yönetim paneline yönlendiriliyorsunuz…</p>
  );
}
