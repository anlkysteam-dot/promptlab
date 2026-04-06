import type { Metadata } from "next";
import { AdminNav } from "@/components/admin-nav";
import { assertAdmin } from "@/lib/admin-auth";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await assertAdmin();
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="mx-auto max-w-6xl scroll-smooth px-4 py-8 sm:px-6">
        <AdminNav />
        {children}
      </div>
    </div>
  );
}
