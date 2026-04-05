import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Gizlilik ve KVKK Aydınlatması — PromptLab",
  description:
    "PromptLab kişisel verilerin korunması, KVKK kapsamında aydınlatma metni ve gizlilik politikası.",
};

const contactPlaceholder =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "İletişim e-postası yayına almadan önce buraya eklenecektir.";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <Link href="/" className="text-sm text-[var(--accent)] hover:underline">
        ← Ana sayfa
      </Link>

      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-[var(--text)] sm:text-3xl">
        Aydınlatma Metni ve Gizlilik Politikası
      </h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) uyarınca veri sorumlusu sıfatıyla bilgilendirme.
      </p>
      <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-100/95">
        Bu metin genel bilgilendirme içindir. Şirket unvanı, adres ve resmi temsilci bilgileri yayına almadan önce
        güncellenmeli; nihai hukuki uygunluk için bir hukuk müşavirinden destek almanız önerilir.
      </p>

      <article className="mt-10 space-y-10 text-sm leading-relaxed text-[var(--muted)]">
        <section id="veri-sorumlusu">
          <h2 className="text-base font-semibold text-[var(--text)]">1. Veri sorumlusu</h2>
          <p className="mt-3">
            PromptLab hizmetini sunan tüzel/gerçek kişi (&quot;Veri Sorumlusu&quot;) tarafından işletilmektedir. Ticari unvan,
            adres ve KVKK başvuru kanalları yayına alınırken bu bölüm güncellenecektir.
          </p>
          <p className="mt-2">
            <strong className="text-[var(--text)]">İletişim:</strong> {contactPlaceholder}
          </p>
        </section>

        <section id="isleme-kapsami">
          <h2 className="text-base font-semibold text-[var(--text)]">2. İşlenen kişisel veriler</h2>
          <p className="mt-3">Hizmetin niteliğine bağlı olarak örneğin şunlar işlenebilir:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong className="text-[var(--text)]">Kimlik / iletişim:</strong> ad, e-posta (kayıt, giriş, destek).
            </li>
            <li>
              <strong className="text-[var(--text)]">Müşteri işlem:</strong> hesap oluşturma, oturum, abonelik ve ödeme ile
              ilgili kayıtlar (ör. Stripe üzerinden işlenen ödeme verileri doğrudan bizde tutulmayabilir).
            </li>
            <li>
              <strong className="text-[var(--text)]">İçerik verisi:</strong> prompt oluşturmak için girdiğin metinler; bu
              metinler ürün özelliği gereği işlenmek veya üçüncü taraf yapay zeka API&apos;lerine iletilmek üzere
              kullanılabilir.
            </li>
            <li>
              <strong className="text-[var(--text)]">İşlem güvenliği:</strong> teknik loglar, IP adresi, cihaz/tarayıcı
              bilgisi (sınırlı süre ve amaçla).
            </li>
          </ul>
        </section>

        <section id="amaclar">
          <h2 className="text-base font-semibold text-[var(--text)]">3. İşleme amaçları ve hukuki sebepler</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              Sözleşmenin kurulması/ifası (KVKK m.5/2-c): hesap, prompt üretimi, ücretli planlar.
            </li>
            <li>
              Meşru menfaat (m.5/2-f): güvenlik, kötüye kullanımın önlenmesi, hizmet iyileştirme — ölçülü ve dengeli
              şekilde.
            </li>
            <li>
              Açık rıza (m.5/1): rıza gerektiren iletişim veya çerezler için ayrıca talep edildiğinde.
            </li>
            <li>
              Hukuki yükümlülük (m.5/2-ç): yasal zorunluluklar halinde.
            </li>
          </ul>
        </section>

        <section id="aktarim">
          <h2 className="text-base font-semibold text-[var(--text)]">4. Yurt içi ve yurt dışı aktarım</h2>
          <p className="mt-3">
            Hizmetin doğası gereği verileriniz; <strong className="text-[var(--text)]">yapay zeka sağlayıcıları</strong> (ör.
            OpenAI ve benzeri), <strong className="text-[var(--text)]">e-posta gönderimi</strong> (ör. Resend),{" "}
            <strong className="text-[var(--text)]">ödeme</strong> (ör. Stripe),{" "}
            <strong className="text-[var(--text)]">kimlik doğrulama</strong> (ör. Google / Microsoft / Apple OAuth) ve{" "}
            <strong className="text-[var(--text)]">barındırma</strong> sağlayıcılarına, hizmetin ifası için aktarılabilir.
            Yurt dışına aktarımda KVKK&apos;daki şartlara uygun hareket edilir; sağlayıcıların gizlilik politikalarını
            incelemeniz önerilir.
          </p>
        </section>

        <section id="saklama">
          <h2 className="text-base font-semibold text-[var(--text)]">5. Saklama süresi</h2>
          <p className="mt-3">
            Veriler, işleme amacının gerektirdiği süre ve yasal zamanaşımı süreleriyle sınırlı tutulur. Hesabını kapattığında
            veya silme talebinde bulunduğunda makul süre içinde silme, yok etme veya anonimleştirme için süreçler
            tanımlanmalıdır (teknik yedekler hariç, makul gecikmeyle).
          </p>
        </section>

        <section id="haklar">
          <h2 className="text-base font-semibold text-[var(--text)]">6. İlgili kişinin hakları (KVKK md. 11)</h2>
          <p className="mt-3">KVKK kapsamında örneğin şunları talep edebilirsin:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Kişisel verilerinin işlenip işlenmediğini öğrenme,</li>
            <li>İşlenmişse buna ilişkin bilgi talep etme,</li>
            <li>İşlenme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme,</li>
            <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme,</li>
            <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme,</li>
            <li>KVKK&apos;da öngörülen şartlar çerçevesinde silinmesini veya yok edilmesini isteme,</li>
            <li>Düzeltme/silme işlemlerinin aktarıldığı üçüncü kişilere bildirilmesini isteme,</li>
            <li>Münhasıran otomatik sistemler ile analiz edilmesi suretiyle aleyhine bir sonucun ortaya çıkmasına itiraz,</li>
            <li>Kanuna aykırı işlenmesi sebebiyle zararın giderilmesini talep.</li>
          </ul>
          <p className="mt-3">
            Taleplerini yukarıdaki iletişim kanalından iletebilirsin. Başvurunun reddedilmesi, verilen cevabın yetersiz
            bulunması veya süresinde cevap verilmemesi hallerinde Kişisel Verileri Koruma Kurulu&apos;na şikâyette
            bulunabilirsin.
          </p>
        </section>

        <section id="guvenlik">
          <h2 className="text-base font-semibold text-[var(--text)]">7. Güvenlik</h2>
          <p className="mt-3">
            Uygun teknik ve idari tedbirlerle verilerin güvenliği sağlanmaya çalışılır. İnternet ortamında %100 güvenlik
            mümkün olmadığından güçlü şifre kullanman ve hesap bilgilerini paylaşmaman önemlidir.
          </p>
        </section>

        <section id="cerezler">
          <h2 className="text-base font-semibold text-[var(--text)]">8. Çerezler ve oturum</h2>
          <p className="mt-3">
            Giriş yaptığında oturumun sürdürülmesi için çerezler ve benzeri teknolojiler kullanılabilir (kimlik doğrulama
            sağlayıcısı Clerk üzerinden oturum çerezleri). Zorunlu çerezler hizmetin çalışması için gereklidir.
          </p>
          <p className="mt-3">
            Site altındaki çerez bildiriminde &quot;Çerezleri kabul et&quot; seçeneğini işaretlersen, anonim kullanım
            istatistikleri için üçüncü taraf analitik araçları (ör. Plausible veya Google Analytics — hangisi
            yapılandırıldıysa) devreye alınabilir. &quot;Yalnızca zorunlu&quot; seçeneğini kullanırsan bu tür istatistik
            çerezleri yüklenmez.
          </p>
        </section>

        <section id="degisiklik">
          <h2 className="text-base font-semibold text-[var(--text)]">9. Değişiklikler</h2>
          <p className="mt-3">
            Bu metin güncellenebilir. Önemli değişikliklerde site üzerinden duyuru yapılması hedeflenir. Son güncelleme:{" "}
            <time dateTime="2026-04-05">5 Nisan 2026</time>.
          </p>
        </section>
      </article>

      <p className="mt-12 border-t border-[var(--border)] pt-8 text-center text-xs text-[var(--muted)]">
        <Link href="/hizmet-sartlari" className="text-[var(--text)] hover:underline">
          Hizmet şartları
        </Link>
        <span className="mx-2">·</span>
        <Link href="/" className="text-[var(--accent)] hover:underline">
          Ana sayfa
        </Link>
      </p>
    </div>
  );
}
