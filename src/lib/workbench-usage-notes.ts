import type { AiTargetId } from "@/lib/targets";

/** “Prompt + ipucu” görünümünde gösterilen statik kullanım notları (Türkçe). */
const NOTES: Record<AiTargetId, string> = {
  universal:
    "Bu metin araçtan bağımsız tasarlandı: kullandığın uygulamada doğrudan yapıştırıp gerekirse bir cümleyle modele özel ince ayar yapabilirsin.",
  chatgpt:
    "Metni doğrudan ChatGPT’ye yapıştırabilirsin. Gerekirse sohbetin devamında “daha kısa yap” veya “örnek ekle” diyerek rafine et.",
  claude:
    "Claude’da uzun bağlam açıksa bu promptu başa yapıştırıp altına kaynak metnini ekleyebilirsin.",
  gemini:
    "Gemini’de gerekiyorsa görsel veya PDF ekleyerek aynı görevi sürdürebilirsin; prompt İngilizce kaldığı için çok dilli girişlerde de uygundur.",
  copilot:
    "Copilot / IDE içinde ilgili dosyayı açık tut ve bu metni yorum veya sohbet alanına yapıştır; dil ve çatıyı yukarıda belirttiysen bağlamı koru.",
  midjourney:
    "Midjourney’de /imagine alanına metni yapıştır; PromptLab otomatik --v/--ar eklemez — istersen Lab’da seçtiğin CLI ipuçları model çıktısına yansır, son kontrol sende.",
  stable_diffusion:
    "SDXL / A1111 / ComfyUI tarafında pozitif/negatif prompt alanlarına böl; ağırlık parantezleri veya (etiket:1.2) gibi kullanım araçlarına göre değişir.",
  dalle:
    "Görsel aracında metin alanına yapıştır; yasaklı içerik istemediğinden emin ol ve gerekirse daha soyut bir sahne tarif et.",
  runway:
    "Runway benzeri araçlarda promptu shot list mantığıyla kullan: süre, kamera hareketi ve geçişleri gerekirse iteratif olarak rafine et.",
  veo:
    "Veo tarafında aynı promptu sahne/süre akışıyla test et; ilk denemeden sonra kamera hareketi ve tempo satırlarını güncelle.",
  sora:
    "Sora benzeri modellerde mekansal tutarlılık için karakter/objeleri sabit isimlerle tanımla; shot geçişlerini net yaz.",
  kling:
    "Kling’de kısa denemelerle başlayıp hareket ve ışık satırlarını optimize et; promptu sahne bazlı bölmek kaliteyi artırır.",
  pika:
    "Pika’da özellikle motion ve transition satırlarını açık bırak; gerektiğinde ikinci turda stil yerine hareket kısıtlarını sıkılaştır.",
  generic:
    "Bu blok çoğu LLM için uygundur; araç menüsünden model dilini ve güvenlik ayarlarını kontrol etmeyi unutma.",
};

export function getWorkbenchUsageNote(target: AiTargetId): string {
  return NOTES[target];
}
