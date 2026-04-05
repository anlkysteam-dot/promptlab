import { redirect } from "next/navigation";

/** Eski e-posta bağlantısı; Clerk kullanılıyor. */
export default function LegacyResetPasswordPage() {
  redirect("/auth");
}
