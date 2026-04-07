import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "KVKK Bilgilendirmesi — PromptLab",
  description: "PromptLab KVKK kapsamında veri işleme, haklar ve başvuru süreçleri bilgilendirmesi.",
};

const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "support@promptlab.app";

export default function KvkkPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <Link href="/" className="text-sm text-[var(--accent)] hover:underline">
        ← Ana sayfa
      </Link>

      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-[var(--text)] sm:text-3xl">
        KVKK Bilgilendirmesi
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
        Bu sayfa, 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında PromptLab kullanıcılarını bilgilendirmek
        amacıyla hazırlanmıştır.
      </p>

      <article className="mt-8 space-y-8 text-sm leading-relaxed text-[var(--muted)]">
        <section>
          <h2 className="text-base font-semibold text-[var(--text)]">1. Veri kategorileri</h2>
          <p className="mt-2">
            Platformda üyelik ve hizmet sunumu için iletişim bilgisi, kullanım verisi, güvenlik logları, prompt girdi
            ve çıktı kayıtları işlenebilir.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text)]">2. Veri işleme amaçları</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Hesap oluşturma, giriş ve oturum yönetimi,</li>
            <li>Prompt üretim hizmetinin sunulması,</li>
            <li>Ödeme, abonelik ve kredi işlemlerinin yürütülmesi,</li>
            <li>Güvenlik, kötüye kullanım önleme ve hizmet iyileştirme.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text)]">3. İlgili kişi hakları</h2>
          <p className="mt-2">
            KVKK md.11 uyarınca; veriye erişim, düzeltme, silme, işleme itirazı ve zarar giderimi gibi yasal haklarını
            kullanabilirsin.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text)]">4. Başvuru yöntemi</h2>
          <p className="mt-2">
            KVKK başvurularını <strong className="text-[var(--text)]">{contactEmail}</strong> adresine, hesap e-postan
            ile birlikte iletebilirsin. Talepler mevzuattaki süreler içinde değerlendirilir.
          </p>
        </section>
      </article>

      <p className="mt-12 border-t border-[var(--border)] pt-8 text-center text-xs text-[var(--muted)]">
        <Link href="/gizlilik" className="text-[var(--text)] hover:underline">
          Gizlilik politikası
        </Link>
        <span className="mx-2">·</span>
        <Link href="/" className="text-[var(--accent)] hover:underline">
          Ana sayfa
        </Link>
      </p>
    </div>
  );
}
