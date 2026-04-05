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
    "Midjourney’de /imagine veya eşdeğer alana ana betimlemeyi yapıştır; parametreleri (--ar, --style) platformda sonradan ekleyebilirsin.",
  dalle:
    "Görsel aracında metin alanına yapıştır; yasaklı içerik istemediğinden emin ol ve gerekirse daha soyut bir sahne tarif et.",
  generic:
    "Bu blok çoğu LLM için uygundur; araç menüsünden model dilini ve güvenlik ayarlarını kontrol etmeyi unutma.",
};

export function getWorkbenchUsageNote(target: AiTargetId): string {
  return NOTES[target];
}
