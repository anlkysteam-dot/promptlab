import type { AiTargetId } from "@/lib/targets";

export type QuickStarterCategory = "content" | "email" | "coding" | "presentation" | "video" | "image";

export type QuickStarter = {
  id: string;
  label: string;
  category: QuickStarterCategory;
  target: AiTargetId;
  variants: string[];
};

export const QUICK_STARTERS: QuickStarter[] = [
  {
    id: "ig-content",
    label: "Instagram içeriği",
    category: "content",
    target: "universal",
    variants: [
      "Kahve dükkanım için haftalık 5 Instagram gönderisi fikri ve kısa açıklama metinleri istiyorum; sıcak ve samimi bir ton olsun.",
      "Yeni açılan pilates stüdyom için Instagram'da 7 günlük reels fikir listesi istiyorum; motive edici ve sade bir dil kullan.",
      "Takı markam için anneler günü temalı 4 carousel gönderi fikri üret; premium his versin, satış odaklı ama itici olmasın.",
      "Kişisel gelişim hesabım için 1 haftalık Instagram içerik planı oluştur; hook cümlesi ve CTA da olsun.",
    ],
  },
  {
    id: "blog-article",
    label: "Blog yazısı",
    category: "content",
    target: "universal",
    variants: [
      "Yapay zekanın KOBİ'lere etkisi hakkında SEO uyumlu bir blog yazısı taslağı oluştur; başlık önerileri de ver.",
      "E-ticaret siteleri için dönüşüm artıran ürün sayfası metinleri hakkında öğretici bir blog yazısı hazırla.",
      "Uzaktan çalışma verimliliği üzerine uzman görüşü gibi duran, kaynak odaklı bir blog yazısı promptu oluştur.",
      "Kişisel marka inşası konusunda yeni başlayanlar için rehber niteliğinde blog içeriği üret.",
    ],
  },
  {
    id: "youtube-script",
    label: "YouTube senaryosu",
    category: "content",
    target: "universal",
    variants: [
      "8 dakikalık YouTube videosu için 'AI ile günlük planlama' konusunda giriş-gelişme-kapanış yapısında senaryo yazdıracak prompt oluştur.",
      "Teknoloji haberleri kanalım için haftalık özet videosu senaryosu üretmeye uygun prompt hazırla.",
      "Eğitici bir yazılım videosu için anlatım akışı ve bölüm geçişleri olan YouTube script promptu yaz.",
      "Motivasyon temalı kısa YouTube videosu için akıcı ve etkileyici bir anlatım promptu oluştur.",
    ],
  },
  {
    id: "linkedin-post",
    label: "LinkedIn gönderisi",
    category: "content",
    target: "universal",
    variants: [
      "Yazılım ekiplerinde code review kültürü hakkında profesyonel bir LinkedIn gönderisi üretmek için prompt yaz.",
      "Kariyer tavsiyesi veren, samimi ama iddialı olmayan bir LinkedIn post promptu oluştur.",
      "SaaS büyüme metrikleri üzerine kısa, veri odaklı bir LinkedIn içerik promptu yaz.",
      "Yeni ürün lansmanı sonrası öğrenimleri paylaşan bir founder postu üretmek için prompt oluştur.",
    ],
  },
  {
    id: "x-thread",
    label: "X thread",
    category: "content",
    target: "universal",
    variants: [
      "Yapay zeka araçlarıyla verimlilik artırma konusunda 8 tweetlik X thread üretmeye uygun prompt oluştur.",
      "Startup kurarken yapılan 10 yaygın hata üzerine dikkat çekici bir X thread promptu yaz.",
      "Freelance çalışanlar için müşteri iletişimi ipuçları anlatan X thread promptu hazırla.",
      "JavaScript performans optimizasyonu konusunda teknik ama akıcı bir X thread promptu oluştur.",
    ],
  },
  {
    id: "email-general",
    label: "E-posta",
    category: "email",
    target: "universal",
    variants: [
      "Müşteriye gecikmiş sipariş için özür dileyen, nazik ve profesyonel bir e-posta taslağı yaz.",
      "Yeni ürün lansmanını mevcut müşterilere duyuran kısa ve ikna edici bir e-posta yaz.",
      "Toplantı tarihini ertelemek için kurumsal, net ve saygılı bir e-posta taslağı hazırla.",
      "Deneme süresi biten kullanıcıya premium'a geçiş teklif eden bir e-posta kurgula.",
    ],
  },
  {
    id: "code-general",
    label: "Kod",
    category: "coding",
    target: "copilot",
    variants: [
      "Next.js 15 App Router’da basit bir form ve sunucu aksiyonu ile iletişim formu örneği istiyorum; TypeScript kullan.",
      "Node.js ve Express ile JWT tabanlı giriş sistemi iskeleti yaz; refresh token akışını da ekle.",
      "Python'da CSV okuyup temel istatistik çıkaran küçük bir CLI araç yaz; argüman parsing de olsun.",
      "React'te reusable modal component yaz; erişilebilirlik (a11y) kuralları ve keyboard navigation dahil olsun.",
    ],
  },
  {
    id: "presentation-general",
    label: "Sunum",
    category: "presentation",
    target: "universal",
    variants: [
      "Yapay zekanın eğitimde kullanımı hakkında 10 slaytlık sunum için başlıklar ve her slaytta 3 madde özet istiyorum.",
      "KOBİ'lerde dijital dönüşüm konusunda yönetim kuruluna sunulacak 8 slaytlık profesyonel sunum planı oluştur.",
      "Yeni mezunlara yönelik kariyer planlama semineri için 12 slaytlık eğitim akışı hazırla.",
      "Siber güvenlik farkındalığı için çalışanlara yönelik kısa ama etkili bir sunum iskeleti yaz.",
    ],
  },
  {
    id: "video-ad",
    label: "Video reklam",
    category: "video",
    target: "runway",
    variants: [
      "Yeni nesil spor ayakkabım için 8 saniyelik dikey video reklam promptu istiyorum: 3 sahne, dinamik kamera, gece şehir atmosferi, güçlü kapanış.",
      "Organik meyve suyu markası için 10 saniyelik sosyal medya reklam videosu kurgula; ferah, yaz enerjisi, hızlı tempo.",
      "Parfüm markası için lüks his veren 12 saniyelik cinematic reklam promptu yaz; close-up detaylar ve dramatik ışık olsun.",
      "Yeni fintech uygulamam için 9:16 formatında, güven veren ama modern bir ürün tanıtım videosu promptu oluştur.",
    ],
  },
  {
    id: "video-cinematic",
    label: "Sinematik video",
    category: "video",
    target: "sora",
    variants: [
      "Yağmurlu Tokyo sokaklarında yürüyen karakter için sinematik kısa film tarzında video promptu yaz; shot sırası, kamera hareketi ve mood net olsun.",
      "Çölde tek başına ilerleyen kaşif için epik kısa sahne promptu oluştur; geniş açı ve yavaş kamera hareketleri olsun.",
      "Karlı dağ köyünde geçen duygusal bir kısa sahne için cinematic video promptu yaz; sıcak-soğuk ışık kontrastı kullan.",
      "Gelecek temalı bir şehirde gece geçen kısa sinematik takip sahnesi promptu yaz; neon ışıklar ve ritmik kurgu olsun.",
    ],
  },
  {
    id: "image-social-ad",
    label: "Görsel reklam",
    category: "image",
    target: "dalle",
    variants: [
      "Yeni cilt bakım markam için premium görünümlü sosyal medya reklam görseli üretmek üzere prompt yaz; temiz kompozisyon ve güçlü USP olsun.",
      "Sporcu gıda markası için enerjik, yüksek kontrastlı Instagram reklam görseli promptu hazırla.",
      "Kahve markası için minimal ama premium bir kampanya görseli oluşturacak prompt yaz.",
      "Online eğitim platformu için güven veren ve modern bir reklam görseli promptu üret.",
    ],
  },
  {
    id: "image-concept",
    label: "Concept art",
    category: "image",
    target: "midjourney",
    variants: [
      "Buzlarla kaplı terk edilmiş bir şehirde geçen post-apokaliptik concept art üretmek için güçlü prompt yaz.",
      "Fantastik bir orman krallığı için detaylı concept art promptu oluştur; atmosferik ışık ve derinlik hissi olsun.",
      "Cyberpunk pazar meydanı için kalabalık, neon ağırlıklı concept art promptu yaz.",
      "Uzay kolonisi iç mekânı için bilimkurgu concept art promptu üret; mimari dil ve renk paleti net olsun.",
    ],
  },
];
