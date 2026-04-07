import type { Metadata } from "next";
import Link from "next/link";
import { SignIn } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Giriş — PromptLab",
  description: "Hesabına giriş yap",
};

const clerkAppearance = {
  variables: {
    colorPrimary: "#c4b5fd",
    colorText: "#e4e4e7",
    colorTextSecondary: "#a1a1aa",
    colorBackground: "#18181b",
    colorInputBackground: "#27272a",
    colorInputText: "#fafafa",
  },
  elements: {
    card: "border border-[var(--border)] bg-[var(--surface)] shadow-none",
    headerTitle: "text-[var(--text)]",
    headerSubtitle: "text-[var(--muted)]",
    socialButtonsBlockButton:
      "border-[var(--border)] bg-[var(--bg)] text-[var(--text)] hover:bg-[var(--hover-surface)]",
    formButtonPrimary: "bg-[var(--accent)] text-[var(--on-accent)] hover:opacity-90",
    footerActionLink: "text-[var(--accent)]",
  },
} as const;

export default function AuthSignInPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-12 sm:max-w-lg sm:px-6">
      <Link href="/" className="text-sm text-[var(--accent)] hover:underline">
        ← Ana sayfa
      </Link>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-[var(--text)]">Giriş</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        E-posta + şifre, e-posta kodu veya sosyal hesaplarla devam edebilirsin — yöntemler{" "}
        <a
          href="https://dashboard.clerk.com"
          className="text-[var(--brand-lab)] hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          Clerk
        </a>{" "}
        panelinden yönetilir.
      </p>

      <div className="mt-8 flex justify-center">
        <SignIn
          routing="path"
          path="/auth"
          signUpUrl="/auth/kayit"
          forceRedirectUrl="/"
          appearance={clerkAppearance}
        />
      </div>

      <p className="mt-8 text-center text-xs text-[var(--muted)]">
        <Link href="/hizmet-sartlari" className="hover:text-[var(--text)] hover:underline">
          Hizmet şartları
        </Link>
        <span className="mx-1.5 text-[var(--border)]">·</span>
        <Link href="/gizlilik" className="hover:text-[var(--text)] hover:underline">
          Gizlilik
        </Link>
      </p>
    </div>
  );
}
