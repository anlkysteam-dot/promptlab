import Link from "next/link";

const showcaseCards = [
  {
    title: "Instagram Reel",
    before: "Yeni ürünümüzü tanıtan kısa bir metin yazar mısın?",
    after:
      "Role: Senior social strategist\nTask: 20 sn'lik Reel için 3 kanca + CTA üret\nFormat: Hook / Body / CTA\nTone: enerjik, net, dönüşüm odaklı",
  },
  {
    title: "Video Scene Continuity",
    before: "Kırmızı paltolu yaşlı adamla 4 sahne üret.",
    after:
      "Scene 1-4 continuity lock aktif.\nKarakterin yüz hatları, kostüm ve ışık paleti sabit.\nHer sahnede tek yeni aksiyon + sinematik kamera notu.",
  },
];

const features = [
  {
    title: "Araç Odaklı Çıktı",
    description: "ChatGPT, Midjourney, Copilot ve video araçları için hedefe uygun prompt üretir.",
  },
  {
    title: "Kredi ve Geçmiş Şeffaflığı",
    description: "Harcanan krediyi anlık görür, profilde kredi hareketlerini takip edersin.",
  },
  {
    title: "Director's Desk",
    description:
      "Karakter kütüphanesi, stil kartı ve AI scene/character continuity kurallarıyla tutarlı proje akışı sunar.",
  },
];

const testimonials = [
  {
    name: "Ece K.",
    role: "İçerik üreticisi",
    quote:
      "Eskiden doğru promptu bulmak için 20 dakika deneme yapıyordum. Prompt Lab ile 2-3 dakikada yayın kalitesinde çıktı alıyorum.",
  },
  {
    name: "Mert A.",
    role: "Ajans kreatif direktörü",
    quote:
      "Özellikle sahne devamlılığı bizim için oyun değiştirici oldu. Video brief'leri ekibe çok daha net aktarabiliyoruz.",
  },
  {
    name: "Selin T.",
    role: "E-ticaret marka yöneticisi",
    quote:
      "Instagram ve reklam metni üretiminde hız ciddi arttı. Prompt kalitesi ekipte standart hale geldi.",
  },
];

const comparisonRows = [
  { label: "Araç odaklı çıktı", promptLab: "Var (hedefe uyumlu)", generic: "Sınırlı / manuel" },
  { label: "Sahne devamlılığı", promptLab: "Var (continuity lock)", generic: "Yok" },
  { label: "Karakter kütüphanesi", promptLab: "Var", generic: "Yok" },
  { label: "Kredi hareket geçmişi", promptLab: "Var", generic: "Genelde yok" },
  { label: "Hızlı başlangıç şablonları", promptLab: "Var", generic: "Parçalı" },
];

export default function HomePage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-8 sm:px-6 sm:py-10">
      <header className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 px-4 py-3 backdrop-blur">
        <p className="text-sm font-semibold text-[var(--text)]">
          <span className="mr-2 inline-grid h-6 w-6 place-items-center rounded-md border border-[var(--border)] bg-[var(--bg)] text-xs">
            pL
          </span>
          Prompt <span className="text-[var(--brand-lab)]">Lab</span>
        </p>
        <div className="flex items-center gap-2">
          <Link
            href="/en"
            className="rounded-md border border-[var(--border)] px-2.5 py-1 text-xs text-[var(--muted)] hover:text-[var(--text)]"
          >
            EN
          </Link>
          <Link
            href="/auth/kayit"
            className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text)] hover:bg-[var(--hover-surface)]"
          >
            Giriş / Kayıt
          </Link>
          <Link
            href="/tr"
            className="app-pressable rounded-md bg-[var(--accent)] px-3.5 py-1.5 text-xs font-semibold text-[var(--on-accent)]"
          >
            Uygulamayı Aç
          </Link>
        </div>
      </header>

      <main className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-start">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8">
          <p className="inline-flex rounded-full border border-[var(--brand-lab)]/40 bg-[var(--brand-lab-dim)] px-3 py-1 text-xs font-medium text-[var(--text)]">
            Prompt Lab Vitrin
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-5xl">
            Video Prompt Generator:
            <br />
            <span className="text-[var(--brand-lab)]">AI Scene Continuity</span> ile profesyonel prompt üret.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--muted)] sm:text-base">
            Prompt Lab bir <strong className="text-[var(--text)]">Video Prompt Generator</strong> ve{" "}
            <strong className="text-[var(--text)]">AI Prompt Builder</strong> olarak çalışır; fikrini hedeflediğin
            araca göre optimize eder. En kritik farkı ise <strong className="text-[var(--text)]">character continuity</strong>{" "}
            (karakter devamlılığı) desteği ile sahneler arasında yüz, stil ve atmosfer tutarlılığını korumasıdır.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href="/tr"
              className="app-pressable rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--on-accent)] shadow-[0_0_0_1px_rgba(94,234,212,0.35),0_0_24px_rgba(94,234,212,0.35)] ring-1 ring-[var(--accent)]/30 hover:shadow-[0_0_0_1px_rgba(94,234,212,0.5),0_0_30px_rgba(94,234,212,0.45)]"
            >
              Hemen dene
            </Link>
            <Link
              href="/tr/nasil-calisir"
              className="rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--text)] hover:bg-[var(--hover-surface)]"
            >
              Nasıl çalışır?
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Kısa Demo Akışı</p>
            <div className="mt-3 grid gap-3">
              {showcaseCards.map((card) => (
                <article key={card.title} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
                  <p className="text-xs font-semibold text-[var(--text)]">{card.title}</p>
                  <p className="mt-2 text-[11px] text-[var(--muted)]">
                    <span className="font-semibold text-[var(--text)]">Önce:</span> {card.before}
                  </p>
                  <pre className="mt-2 overflow-x-auto rounded-md border border-[var(--border)] bg-[var(--bg)] p-2 text-[11px] leading-relaxed text-[var(--muted)]">
                    {card.after}
                  </pre>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        {features.map((item) => (
          <article key={item.title} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <p className="text-sm font-semibold text-[var(--text)]">{item.title}</p>
            <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">{item.description}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">3 adımda kullanım</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3">
            <p className="text-xs font-semibold text-[var(--text)]">1) Hedefini yaz</p>
            <p className="mt-1 text-xs text-[var(--muted)]">Ne üretmek istediğini kendi cümlenle anlat.</p>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3">
            <p className="text-xs font-semibold text-[var(--text)]">2) Modu seç</p>
            <p className="mt-1 text-xs text-[var(--muted)]">Basit veya uzman modla hedef aracını netleştir.</p>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3">
            <p className="text-xs font-semibold text-[var(--text)]">3) Promptu kopyala</p>
            <p className="mt-1 text-xs text-[var(--muted)]">Tek tıkla kopyala, aracına yapıştır, üretime geç.</p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Ürün videosu</p>
            <h2 className="mt-1 text-lg font-semibold text-[var(--text)]">Prompt Lab 30 sn demo</h2>
          </div>
          <Link
            href="/tr"
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text)] hover:bg-[var(--hover-surface)]"
          >
            Canlı dene
          </Link>
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border border-[var(--border)] bg-black/40">
          <video
            className="h-auto w-full"
            controls
            preload="metadata"
            poster="/videos/promptlab-demo-poster.jpg"
          >
            <source src="/videos/promptlab-demo.webm" type="video/webm" />
            <source src="/videos/promptlab-demo.mp4" type="video/mp4" />
          </video>
        </div>
        <p className="mt-2 text-xs text-[var(--muted)]">
          Video dosyalarını `public/videos/promptlab-demo.webm` ve `public/videos/promptlab-demo.mp4` olarak
          eklediğinde otomatik oynatılabilir hale gelir.
        </p>
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[var(--text)]">Kullanıcı yorumları</h2>
          <span className="text-xs text-[var(--muted)]">Gerçek kullanım deneyimleri</span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {testimonials.map((item) => (
            <article key={item.name} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <p className="text-sm leading-relaxed text-[var(--text)]">“{item.quote}”</p>
              <p className="mt-3 text-xs font-semibold text-[var(--text)]">{item.name}</p>
              <p className="text-xs text-[var(--muted)]">{item.role}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Neden Prompt Lab?</p>
        <h2 className="mt-1 text-lg font-semibold text-[var(--text)]">AI Prompt Generator karşılaştırma tablosu</h2>
        <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
          Character continuity, AI scene continuity ve üretime hazır video prompt kalitesi açısından Prompt Lab, klasik
          genel amaçlı araçlara göre daha odaklı bir akış sunar.
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-[var(--bg)]/70 text-[var(--muted)]">
              <tr>
                <th className="px-3 py-2 font-medium">Kriter</th>
                <th className="px-3 py-2 font-medium text-[var(--text)]">Prompt Lab</th>
                <th className="px-3 py-2 font-medium">Standart yaklaşım</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.label} className="border-t border-[var(--border)]">
                  <td className="px-3 py-2 text-[var(--text)]">{row.label}</td>
                  <td className="px-3 py-2 text-emerald-300">{row.promptLab}</td>
                  <td className="px-3 py-2 text-[var(--muted)]">{row.generic}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-[var(--brand-lab)]/35 bg-[var(--brand-lab-dim)]/20 p-5 sm:p-6">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Fiyatlandırma teaser</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-[var(--text)]">Ücretsiz başla, büyüdükçe premiuma geç</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Ücretsiz günlük krediyle dene. Daha yoğun üretim için kredi paketleri ve premium avantajları seni bekliyor.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/pricing"
              className="app-pressable rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--on-accent)]"
            >
              Fiyatları gör
            </Link>
            <Link
              href="/tr/kredi"
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text)] hover:bg-[var(--hover-surface)]"
            >
              Kredi al
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
