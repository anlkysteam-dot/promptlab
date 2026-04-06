import type { AiTargetId } from "@/lib/targets";

/** Textarea altında gösterilen, hedef araca özel kısa yönlendirme (Türkçe). */
const HINTS: Record<AiTargetId, string> = {
  universal:
    "Varsayılan mod: isteğini yaz; çıktı Role–Task–Format çerçevesinde, modele özel sözdizimi olmadan üretilir. ChatGPT, Claude, Gemini gibi çoğu sohbet aracına yapıştırmaya uygundur.",
  chatgpt:
    "Rol, bağlam, kısıtlar ve istediğin çıktı biçimini (madde, tablo, uzunluk) yazabilirsin; ChatGPT sohbet akışına uygun net talimatlar işe yarar.",
  claude:
    "Uzun metin veya belge özetliyorsan kaynağı kısaca belirt; yapılandırılmış talimatlar ve güvenli sınırlar Claude için uygundur.",
  gemini:
    "Görevi kısa çerçeveleyebilir; ileride görsel veya dosya ekleyeceksen bunu da yazarak Gemini’ye ipucu vermiş olursun.",
  copilot:
    "Dil, çatı (ör. Next.js), dosya/bağlam, kabul kriterleri ve kod stilini yaz; mümkünse örnek imza veya hata mesajı ekle.",
  midjourney:
    "Sahne, ışık, stil ve kompozisyonu virgülle ayırarak yaz; sohbet dili yerine görsel betimlemeye odaklan.",
  stable_diffusion:
    "Konu, stil, ışık ve olumsuz istemleri net yaz; SDXL için etiket tarzı, ağırlık ve kompozisyon ipuçları işe yarar.",
  dalle:
    "Konu, ortam, sanat stili ve kadrajı net yaz; politikaya duyarlı ifadelerden kaçın.",
  runway:
    "Video için sahneleri shot bazlı yaz: süre, kamera hareketi, geçiş ve görsel stil detayını belirt (örn. 6-8 sn, dolly-in, cinematic).",
  veo:
    "Video promptunda zaman akışını netleştir: açılış sahnesi, orta aksiyon, kapanış; kamera dili ve atmosferi belirt.",
  sora:
    "Gerçekçi video için fiziksel tutarlılık önemli: mekan, karakter, eylem sırası ve kadraj değişimini açıkça yaz.",
  kling:
    "Kısa ve güçlü video talimatı ver: özne, hareket, ortam, ışık ve ritim; sahneler arası sürekliliği belirt.",
  pika:
    "Pika için motion odaklı tarif yaz: giriş sahnesi, kamera aksiyonu, efekt/transition ve final kare beklentisi.",
  generic:
    "Amaç, hedef kitle, ton ve çıktının yapısını (uzunluk, format) kısaca tanımla.",
};

export function getWorkbenchTargetHint(target: AiTargetId): string {
  return HINTS[target];
}
