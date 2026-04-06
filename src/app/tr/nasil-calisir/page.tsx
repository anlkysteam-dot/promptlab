import type { Metadata } from "next";
import Link from "next/link";
import { FREE_DAILY_CREDIT_BUDGET } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Nasıl çalışır — PromptLab",
  description:
    "PromptLab Lab ekranı, uzman modu, hedef seçimi, kredi sistemi ve Keşfet — adım adım kullanım rehberi.",
};

const sections = [
  { id: "genel", label: "Genel bakış" },
  { id: "adimlar", label: "Temel akış" },
  { id: "giris", label: "Giriş ve profil" },
  { id: "modlar", label: "Evrensel ve uzman mod" },
  { id: "hedef", label: "Hedef (hangi araç?)" },
  { id: "kalite", label: "Kalite ve dil" },
  { id: "lab", label: "Lab seçenekleri" },
  { id: "hizli", label: "Hızlı başlangıç" },
  { id: "proje", label: "Video projeleri" },
  { id: "uret", label: "Oluştur ve sonuç" },
  { id: "kredi", label: "Kredi sistemi" },
  { id: "kesfet", label: "Keşfet" },
  { id: "daha", label: "Daha fazla bilgi" },
] as const;

export default function TrHowItWorksPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <Link href="/tr" className="text-sm text-[var(--accent)] hover:underline">
        ← Ana sayfa (Lab)
      </Link>

      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-[var(--text)]">Nasıl çalışır?</h1>
      <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
        PromptLab, düz dilde yazdığınız isteği seçtiğiniz yapay zekâ aracına uygun, yapılandırılmış bir prompt metnine
        dönüştürür. Bu sayfa, ekrandaki öğelerin ne işe yaradığını ve sırayla ne yapmanız gerektiğini özetler.
      </p>

      <nav
        aria-label="İçindekiler"
        className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">İçindekiler</p>
        <ol className="mt-3 grid gap-2 sm:grid-cols-2">
          {sections.map((s, i) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="text-[var(--accent)] hover:underline">
                {i + 1}. {s.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-12 space-y-12 text-sm leading-relaxed text-[var(--muted)]">
        <section id="genel" className="scroll-mt-24">
          <h2 className="text-lg font-semibold text-[var(--text)]">1. Genel bakış</h2>
          <p className="mt-3">
            Ana sayfa aslında <strong className="text-[var(--text)]">Lab</strong> çalışma ekranıdır: üstte başlık ve
            (giriş yaptıysanız) <strong className="text-[var(--text)]">kredi özeti</strong> ile profil bağlantısı, ortada
            isteğinizi yazdığınız alan, altta ise üretilen metin ve yardımcı bağlantılar yer alır. PromptLab doğrudan
            Midjourney, ChatGPT vb. uygulamalarda komut çalıştırmaz; size{" "}
            <strong className="text-[var(--text)]">kopyalayıp yapıştırabileceğiniz metin</strong> verir.
          </p>
        </section>

        <section id="adimlar" className="scroll-mt-24">
          <h2 className="text-lg font-semibold text-[var(--text)]">2. Temel akış (sırayla)</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            <li>
              <strong className="text-[var(--text)]">Ne istediğinizi yazın</strong> (büyük metin kutusu). Örn: “Ürün
              lansmanı için kısa bir e-posta tonu istiyorum.”
            </li>
            <li>
              İsterseniz <strong className="text-[var(--text)]">uzman modu</strong> açıp{" "}
              <strong className="text-[var(--text)]">hedef</strong> seçin (ör. Midjourney, ChatGPT).
            </li>
            <li>
              <strong className="text-[var(--text)]">Kalite</strong> (Normal / Advanced) ve çıktı{" "}
              <strong className="text-[var(--text)]">dilini</strong> ayarlayın; video/görsel hedeflerde uygunsa{" "}
              <strong className="text-[var(--text)]">medya ön ayarı</strong> seçin.
            </li>
            <li>
              <strong className="text-[var(--text)]">Profesyonel prompt oluştur</strong> (veya formdaki gönder) ile
              üretimi başlatın. Bir süre sonra sonuç alanında metin belirir.
            </li>
            <li>
              Metni <strong className="text-[var(--text)]">kopyalayın</strong> veya{" "}
              <strong className="text-[var(--text)]">ChatGPT’de aç</strong> ile panoya alıp tarayıcıda ChatGPT’ye
              yönlenebilirsiniz.
            </li>
          </ol>
        </section>

        <section id="giris" className="scroll-mt-24">
          <h2 className="text-lg font-semibold text-[var(--text)]">3. Giriş ve profil</h2>
          <p className="mt-3">
            <strong className="text-[var(--text)]">Giriş yap</strong> demeden de Lab’ı kullanabilirsiniz; üretimlerin bir
            kısmı cihazınıza göre anonim kota ile sınırlanır. <strong className="text-[var(--text)]">Giriş</strong>{" "}
            yaptığınızda üretim geçmişiniz,{" "}
            <Link href="/tr/profil" className="text-[var(--accent)] underline hover:no-underline">
              Profil
            </Link>{" "}
            üzerinden <strong className="text-[var(--text)]">kullanım</strong> ve{" "}
            <strong className="text-[var(--text)]">kredi hareketleri</strong> gibi bilgilere erişirsiniz. Sağ üstteki
            küçük özet, günlük kalan kota ve satın alınan bonus krediyi (varsa) gösterir.
          </p>
        </section>

        <section id="modlar" className="scroll-mt-24">
          <h2 className="text-lg font-semibold text-[var(--text)]">4. Evrensel mod ve uzman mod</h2>
          <p className="mt-3">
            <strong className="text-[var(--text)]">Evrensel (varsayılan):</strong> Hedef seçmeden, genel “Role–Task–Format”
            tarzı akıllı optimizasyonla çalışır; çoğu günlük görev için yeterlidir.
          </p>
          <p className="mt-3">
            <strong className="text-[var(--text)]">Uzman mod:</strong> Belirli bir araç seçtiğinizde (ör. Midjourney,
            Claude) sistem promptu o ekosisteme göre şekillenir. Uzman modda ek alanlar (konu, ton, kitle gibi) görünür;
            bunlar isteğe bağlıdır ama çıktıyı netleştirir.
          </p>
        </section>

        <section id="hedef" className="scroll-mt-24">
          <h2 className="text-lg font-semibold text-[var(--text)]">5. Hedef (hangi araç?)</h2>
          <p className="mt-3">
            Uzman modda açılan <strong className="text-[var(--text)]">hedef</strong> listesi, üretilen metnin dilini ve
            yapısını o araca göre uyarlar (sohbet botu, görsel, video vb.). Hedef değiştirdiğinizde ipuçları ve Lab
            seçenekleri de buna göre güncellenir. Seçtiğiniz hedef yalnızca <strong className="text-[var(--text)]">metin</strong>{" "}
            üretimini etkiler; PromptLab sizin yerinize başka uygulamada hesap açmaz veya komut çalıştırmaz.
          </p>
        </section>

        <section id="kalite" className="scroll-mt-24">
          <h2 className="text-lg font-semibold text-[var(--text)]">6. Kalite modu, dil ve medya ön ayarı</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <strong className="text-[var(--text)]">Normal / Advanced:</strong> Advanced daha ayrıntılı şablon ve kontrol
              listesi ister; <strong className="text-[var(--text)]">kredi maliyeti</strong> de yükselir (ücretsiz planda
              çarpan daha büyüktür).
            </li>
            <li>
              <strong className="text-[var(--text)]">Çıktı dili:</strong> Türkçe veya İngilizce final metin kilidi (metin
              hedeflerinde); görsel/video hedeflerinde model performansı için dil notu farklı olabilir.
            </li>
            <li>
              <strong className="text-[var(--text)]">Medya ön ayarı:</strong> Görsel veya video hedefinde, sahne türü
              (ürün çekimi, sinematik vb.) seçerek modele ek bağlam verirsiniz.
            </li>
          </ul>
        </section>

        <section id="lab" className="scroll-mt-24">
          <h2 className="text-lg font-semibold text-[var(--text)]">7. Lab seçenekleri (isteğe bağlı)</h2>
          <p className="mt-3">
            Lab alanı, özellikle görsel ve video hedeflerinde <strong className="text-[var(--text)]">format</strong>,{" "}
            <strong className="text-[var(--text)]">negatif prompt</strong>, <strong className="text-[var(--text)]">lezzet</strong>{" "}
            (stil yönlendirmesi) gibi alanlar sunar. Midjourney için{" "}
            <strong className="text-[var(--text)]">sürüm ve en-boy</strong> ipuçlarını metne dahil edip etmeyeceğinizi
            işaretleyebilirsiniz. <strong className="text-[var(--text)]">Önerilen parametreler</strong> açıksa, hedefe uygun
            bilgilendirici ipuçları eklenir; bunlar otomatik olarak başka uygulamaya yapıştırılmaz —{" "}
            <strong className="text-[var(--text)]">son kontrol sizdedir</strong>.
          </p>
        </section>

        <section id="hizli" className="scroll-mt-24">
          <h2 className="text-lg font-semibold text-[var(--text)]">8. Hızlı başlangıç örnekleri</h2>
          <p className="mt-3">
            Sayfanın üst kısmındaki <strong className="text-[var(--text)]">kategori filtreleri</strong> ve{" "}
            <strong className="text-[var(--text)]">örnek düğmeleri</strong>, tek tıkla metin kutusuna hazır bir başlangıç
            cümlesi ve uygun hedef seçimi yükler. Aynı düğmeye tekrar bastığınızda havuzdan başka bir varyasyon
            gelebilir. <strong className="text-[var(--text)]">Bana rastgele örnek ver</strong> ile rastgele bir başlangıç
            seçilir.
          </p>
        </section>

        <section id="proje" className="scroll-mt-24">
          <h2 className="text-lg font-semibold text-[var(--text)]">9. Video projeleri (uzman + video hedefi)</h2>
          <p className="mt-3">
            Video odaklı bir hedef seçtiyseniz ve giriş yaptıysanız, <strong className="text-[var(--text)]">proje</strong>{" "}
            oluşturup sahne sahne istek girebilirsiniz. Her üretim, proje bağlamında kaydedilebilir; böylece aynı karakter
            veya stil üzerinden ilerleyebilirsiniz. Proje paneli yalnızca ilgili hedef ve oturumdayken görünür.
          </p>
        </section>

        <section id="uret" className="scroll-mt-24">
          <h2 className="text-lg font-semibold text-[var(--text)]">10. “Prompt oluştur” ve sonrası</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              Düğmeye bastığınızda istek sunucuya gider; başarılı olursa sonuç kutusunda metin görünür. Hata mesajı
              alırsanız metin kutusunu veya hedefi gözden geçirin.
            </li>
            <li>
              Girişli kullanıcıda başarılı üretimden sonra alttan kısa bir{" "}
              <strong className="text-[var(--text)]">kredi özeti</strong> bildirimi çıkabilir (harcanan ağırlık, kalan
              günlük / bonus).
            </li>
            <li>
              <strong className="text-[var(--text)]">Kopyala</strong> panoya alır; <strong className="text-[var(--text)]">ChatGPT’de aç</strong>{" "}
              panoya alıp ChatGPT sitesini yeni sekmede açar.
            </li>
          </ul>
        </section>

        <section id="kredi" className="scroll-mt-24">
          <h2 className="text-lg font-semibold text-[var(--text)]">11. Kredi sistemi</h2>
          <p className="mt-3">
            Ücretsiz planda her İstanbul günü <strong className="text-[var(--text)]">{FREE_DAILY_CREDIT_BUDGET}</strong>{" "}
            kredilik günlük bütçe vardır. Başarılı her üretim, Normal/Advanced ve Premium durumuna göre farklı{" "}
            <strong className="text-[var(--text)]">ağırlıkta</strong> kredi harcar. Günlük bütçe yetmezse{" "}
            <strong className="text-[var(--text)]">satın alınan bonus kredi</strong> kullanılır. Premium üyelikte günlük
            tavan uygulanmaz; yine de şeffaflık için maliyet gösterilir. Ayrıntı ve paketler için{" "}
            <Link href="/tr/kredi" className="text-[var(--accent)] underline hover:no-underline">
              Kredi
            </Link>{" "}
            ve{" "}
            <Link href="/pricing" className="text-[var(--accent)] underline hover:no-underline">
              Fiyatlandırma
            </Link>{" "}
            sayfalarına bakın. Profilde <strong className="text-[var(--text)]">kredi hareketleri</strong> geçmişi
            listelenir.
          </p>
        </section>

        <section id="kesfet" className="scroll-mt-24">
          <h2 className="text-lg font-semibold text-[var(--text)]">12. Keşfet</h2>
          <p className="mt-3">
            <Link href="/discover" className="text-[var(--accent)] underline hover:no-underline">
              Keşfet
            </Link>{" "}
            sayfasında topluluk paylaşımlarını inceleyebilirsiniz (özellikler zamanla genişleyebilir). Lab’daki üretiminizi
            paylaşmak isteğe bağlıdır ve ilgili ayarlar üretim akışına bağlıdır.
          </p>
        </section>

        <section id="daha" className="scroll-mt-24">
          <h2 className="text-lg font-semibold text-[var(--text)]">13. Daha fazla bilgi</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <Link href="/tr/sss" className="text-[var(--accent)] underline hover:no-underline">
                Sık sorulan sorular
              </Link>{" "}
              — kısa politikalar ve sık gelen teknik sorular.
            </li>
            <li>
              <Link href="/hakkimizda" className="text-[var(--accent)] underline hover:no-underline">
                Hakkımızda
              </Link>
              ,{" "}
              <Link href="/gizlilik" className="text-[var(--accent)] underline hover:no-underline">
                Gizlilik / KVKK
              </Link>
              ,{" "}
              <Link href="/hizmet-sartlari" className="text-[var(--accent)] underline hover:no-underline">
                Hizmet şartları
              </Link>
              .
            </li>
            <li>
              Lab’da klavye kısayolları için <kbd className="rounded border border-[var(--border)] bg-[var(--bg)] px-1.5 py-0.5 font-mono text-xs text-[var(--text)]">?</kbd>{" "}
              tuşuna basabilirsiniz (profilde de anılır).
            </li>
          </ul>
        </section>
      </div>
    </article>
  );
}
