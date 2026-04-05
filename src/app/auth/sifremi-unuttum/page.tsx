import { redirect } from "next/navigation";

/** Eski NextAuth akışı; şifre sıfırlama artık Clerk giriş ekranı üzerinden. */
export default function LegacyForgotPasswordPage() {
  redirect("/auth");
}
