import type { Metadata } from "next";
import Link from "next/link";
import { FREE_DAILY_CREDIT_BUDGET } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Sık sorulan sorular — PromptLab",
  description: "PromptLab kullanımı, kredi sistemi ve otomatik parametre politikası",
};

export default function TrFaqPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-14 sm:px-6">
      <Link href="/tr" className="text-sm text-[var(--accent)] hover:underline">
        ← Ana sayfa
      </Link>
      <h1 className="mt-6 text-2xl font-semibold text-[var(--text)]">Sık sorulan sorular</h1>

      <section className="mt-8 space-y-4 text-sm leading-relaxed text-[var(--muted)]">
        <h2 className="text-base font-semibold text-[var(--text)]">Otomatik parametre var mı?</h2>
        <p>
          Hayır. PromptLab, Midjourney veya başka araçlara sizin adınıza <strong className="text-[var(--text)]">--v</strong>,{" "}
          <strong className="text-[var(--text)]">--ar</strong> vb. otomatik eklemez veya yapıştırmaz. İsteğe bağlı Lab
          seçenekleri yalnızca modele <em>yönlendirme</em> verir; üretilen metni siz kopyalayıp hedef uygulamada
          kullanırsınız.
        </p>

        <h2 className="mt-8 text-base font-semibold text-[var(--text)]">Kredi sistemi nasıl işler?</h2>
        <p>
          Ücretsiz planda günlük (İstanbul günü) <strong className="text-[var(--text)]">{FREE_DAILY_CREDIT_BUDGET}</strong>{" "}
          kredi bütçeniz vardır. Başarılı her üretim şu ağırlıkta kredi harcar:{" "}
          <strong className="text-[var(--text)]">(Premium ? 1 : 2) × (Advanced ? 2 : 1)</strong>. Örneğin ücretsiz
          kullanıcıda Normal = 2, Advanced = 4; Premium’da Normal = 1, Advanced = 2. Premium’da günlük kredi tavanı
          uygulanmaz; maliyet yine şeffaflık için gösterilir.
        </p>

        <h2 className="mt-8 text-base font-semibold text-[var(--text)]">“Önerilen parametreler” ne demek?</h2>
        <p>
          Uzman modda işaretlerseniz, seçtiğiniz hedef ve Lab lezzetine uygun <em>bilgilendirici</em> başlangıç ipuçları
          modele eklenir. Bunlar yine otomatik uygulanmaz; final kontrol ve yapıştırma size aittir.
        </p>
      </section>
    </div>
  );
}
