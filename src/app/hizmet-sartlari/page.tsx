import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Hizmet şartları — PromptLab",
  description: "PromptLab kullanım koşulları, hesap ve içerik sorumlulukları, ödeme ve iade esasları.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <Link href="/" className="text-sm text-[var(--accent)] hover:underline">
        ← Ana sayfa
      </Link>

      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-[var(--text)] sm:text-3xl">Hizmet Şartları</h1>
      <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
        Bu Hizmet Şartları, PromptLab platformunu kullanımına ilişkin koşulları düzenler. Platformu kullanarak aşağıdaki
        şartları kabul etmiş olursun.
      </p>

      <article className="mt-8 space-y-8 text-sm leading-relaxed text-[var(--muted)]">
        <section>
          <h2 className="text-base font-semibold text-[var(--text)]">1. Hizmetin kapsamı</h2>
          <p className="mt-2">
            PromptLab; kullanıcıların metin, görsel ve video üretim araçları için daha iyi promptlar oluşturmasına
            yardımcı olan bir yazılım hizmetidir. Platform çıktıları öneri niteliğindedir; nihai kullanım
            sorumluluğu kullanıcıya aittir.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text)]">2. Hesap ve güvenlik</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Hesap bilgilerini doğru ve güncel tutmak kullanıcının sorumluluğundadır.</li>
            <li>Hesap güvenliği (şifre, oturum, erişim) kullanıcı tarafından korunmalıdır.</li>
            <li>
              Kötüye kullanım, yetkisiz erişim denemesi veya sistemi manipüle etme tespitinde hesap geçici ya da kalıcı
              olarak sınırlandırılabilir.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text)]">3. İçerik sorumluluğu</h2>
          <p className="mt-2">
            Platforma girilen metinler ve üretilen çıktılar kullanıcı sorumluluğundadır. Hukuka aykırı, telif hakkı
            ihlali içeren, yanıltıcı, zararlı veya üçüncü kişilerin haklarını ihlal eden kullanımlar yasaktır.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text)]">4. Ücretlendirme, kredi ve iade</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Ücretli planlar ve kredi paketleri sipariş anındaki koşullarla sunulur.</li>
            <li>Kredi kullanımı üretim çağrısı ve kalite moduna göre değişebilir.</li>
            <li>
              Teknik hata kaynaklı mükerrer tahsilat veya eksik kredi durumlarında destek kaydı üzerinden inceleme
              yapılır; uygun durumda manuel kredi düzeltmesi uygulanabilir.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text)]">5. Hizmet sürekliliği</h2>
          <p className="mt-2">
            PromptLab, hizmet sürekliliği için makul çabayı gösterir; ancak bakım, altyapı güncellemesi, üçüncü taraf
            servis kesintileri veya mücbir sebepler nedeniyle geçici kesintiler yaşanabilir.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text)]">6. Sorumluluğun sınırlandırılması</h2>
          <p className="mt-2">
            Platform &quot;olduğu gibi&quot; sunulur. Dolaylı zararlar, veri kaybı, iş kesintisi, üçüncü taraf araçlardan
            kaynaklı çıktı farklılıkları veya entegrasyon sorunları için azami ölçüde sorumluluk sınırlandırılır.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[var(--text)]">7. Değişiklikler ve yürürlük</h2>
          <p className="mt-2">
            Bu şartlar gerektiğinde güncellenebilir. Güncel metin platformda yayımlandığı anda yürürlüğe girer.
            Kullanıma devam etmen, güncel şartların kabulü anlamına gelir.
          </p>
          <p className="mt-2">
            Son güncelleme: <time dateTime="2026-04-07">7 Nisan 2026</time>
          </p>
        </section>
      </article>

      <p className="mt-12 border-t border-[var(--border)] pt-8 text-center text-xs text-[var(--muted)]">
        <Link href="/gizlilik" className="text-[var(--text)] hover:underline">
          Gizlilik / KVKK
        </Link>
        <span className="mx-2">·</span>
        <Link href="/" className="text-[var(--accent)] hover:underline">
          Ana sayfa
        </Link>
      </p>
    </div>
  );
}
