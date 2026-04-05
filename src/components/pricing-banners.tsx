"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";

function Inner() {
  const sp = useSearchParams();
  const success = sp.get("success") === "1";
  const canceled = sp.get("canceled") === "1";

  const node = useMemo(() => {
    if (success) {
      return (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          Ödeme tamamlandı. Premium birkaç saniye içinde hesabına yansır; yansımazsa sayfayı yenile.
        </div>
      );
    }
    if (canceled) {
      return (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--muted)]">
          Ödeme iptal edildi. İstediğin zaman tekrar deneyebilirsin.
        </div>
      );
    }
    return null;
  }, [success, canceled]);

  if (!node) return null;
  return <div className="mb-6">{node}</div>;
}

export function PricingBanners() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}
