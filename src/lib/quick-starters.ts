import type { AiTargetId } from "@/lib/targets";

export type QuickStarter = {
  label: string;
  text: string;
  target: AiTargetId;
};

export const QUICK_STARTERS: QuickStarter[] = [
  {
    label: "Instagram içeriği",
    target: "universal",
    text: "Kahve dükkanım için haftalık 5 Instagram gönderisi fikri ve kısa açıklama metinleri istiyorum; sıcak ve samimi bir ton olsun.",
  },
  {
    label: "E-posta",
    target: "universal",
    text: "Müşteriye gecikmiş sipariş için özür dileyen, nazik ve profesyonel bir e-posta taslağı yaz.",
  },
  {
    label: "Kod",
    target: "copilot",
    text: "Next.js 15 App Router’da basit bir form ve sunucu aksiyonu ile iletişim formu örneği istiyorum; TypeScript kullan.",
  },
  {
    label: "Sunum",
    target: "universal",
    text: "Yapay zekanın eğitimde kullanımı hakkında 10 slaytlık sunum için başlıklar ve her slaytta 3 madde özet istiyorum.",
  },
];
