import type { Metadata } from "next";
import Link from "next/link";
import { AboutFeedbackForm } from "@/components/about-feedback-form";

export const metadata: Metadata = {
  title: "Hakkımızda — PromptLab",
  description: "Prompt Lab'in hikayesi ve misyonu",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-14 sm:px-6">
      <Link href="/" className="text-sm text-[var(--accent)] hover:underline">
        ← Ana sayfa
      </Link>

      <h1 className="mt-6 text-2xl font-semibold text-[var(--text)]">Prompt Lab&apos;in Hikayesi</h1>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-[var(--muted)]">
        <p>
          Her şey aslında basit bir gözlemle başladı. Yapay zekanın neler yapabildiğini hepimiz hayranlıkla izliyoruz ama
          iş o devasa gücü doğru yönlendirmeye geldiğinde hepimiz aynı duvara çarpıyoruz: &quot;Ona tam olarak ne
          demeliyim?&quot; Fikirlerimiz ne kadar parlak olursa olsun, onları yapay zekanın anlayacağı o teknik dile dökmek
          bazen yaratıcılığımızın önüne geçiyor. İşte Prompt Lab, bu bariyeri ortadan kaldırmak, hayallerinizle teknoloji
          arasında bir köprü kurmak için doğdu.
        </p>

        <p>
          Burası çok uluslu bir şirketin soğuk bir ürünü değil; her satır kodu tek bir geliştirici tarafından,
          kullanıcıların yaşadığı gerçek sorunlara çözüm bulma tutkusuyla yazılmış bir platform. Özellikle video ve görsel
          üretiminde yaşanan o meşhur &quot;sahneler arası tutarsızlık&quot; sorununu dert edinip, sahne devamlılığını
          sağlayan modülleri bu yüzden sisteme ekledim. İstiyorum ki; siz sadece ne yapmak istediğinizi kendi
          cümlelerinizle yazın, geri kalan tüm teknik karmaşayı, model farklılıklarını ve parametre optimizasyonlarını
          Prompt Lab sizin yerinize halletsin.
        </p>

        <p>
          İsmimizdeki &quot;Lab&quot; ibaresi bir tesadüf değil. Burası yaşayan, sürekli denemeler yapılan ve sizden gelen
          geri bildirimlerle her gün şekillenen bir laboratuvar. Tek başıma çıktığım bu yolculukta en büyük motivasyonum,
          karmaşık komutlar arasında kaybolmadan sadece üretmeye odaklanan bir topluluk oluşturabilmek. Prompt Lab&apos;i
          sadece bir araç olarak değil, yaratıcılığınızı özgür bırakan bir çalışma arkadaşı olarak görmeniz benim için en
          büyük başarı. Bu yolculuğun bir parçası olduğunuz için teşekkürler.
        </p>
      </div>

      <section className="mt-12 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="text-base font-semibold text-[var(--text)]">Geri bildirim</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Düşüncelerinizi paylaşın; okuyorum.
        </p>
        <AboutFeedbackForm />
      </section>

      <p className="mt-16 text-center text-4xl font-black tracking-widest text-[var(--text)] sm:text-5xl">A.K</p>
    </div>
  );
}
