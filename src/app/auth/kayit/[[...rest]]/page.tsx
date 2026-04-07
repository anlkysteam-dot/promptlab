import type { Metadata } from "next";
import Link from "next/link";
import { SignUp } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Kayıt — PromptLab",
  description: "Yeni hesap oluştur",
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

export default function AuthSignUpPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-12 sm:max-w-lg sm:px-6">
      <Link href="/" className="text-sm text-[var(--accent)] hover:underline">
        ← Ana sayfa
      </Link>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-[var(--text)]">Kayıt ol</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        E-posta + şifre ile hesap oluşturabilir veya desteklenen diğer yöntemlerle devam edebilirsin. Zaten hesabın
        var mı?{" "}
        <Link href="/auth" className="text-[var(--accent)] hover:underline">
          Giriş yap
        </Link>
      </p>

      <div className="mt-8 flex justify-center">
        <SignUp
          routing="path"
          path="/auth/kayit"
          signInUrl="/auth"
          forceRedirectUrl="/"
          appearance={clerkAppearance}
        />
      </div>
    </div>
  );
}
