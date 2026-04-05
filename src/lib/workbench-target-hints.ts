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
  dalle:
    "Konu, ortam, sanat stili ve kadrajı net yaz; politikaya duyarlı ifadelerden kaçın.",
  generic:
    "Amaç, hedef kitle, ton ve çıktının yapısını (uzunluk, format) kısaca tanımla.",
};

export function getWorkbenchTargetHint(target: AiTargetId): string {
  return HINTS[target];
}
