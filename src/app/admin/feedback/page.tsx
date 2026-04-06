import { AdminFeedbackHashRedirect } from "@/components/admin-feedback-hash-redirect";

export const metadata = {
  title: "Geri bildirimler — Admin",
  robots: { index: false, follow: false },
};

/** Eski URL; tek panel `/admin#geri-bildirim` adresine taşır. */
export default function AdminFeedbackLegacyPage() {
  return <AdminFeedbackHashRedirect />;
}
