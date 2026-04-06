import Link from "next/link";

const linkClass = "text-[var(--muted)] hover:text-[var(--text)] hover:underline";
const activeClass = "font-medium text-[var(--accent)] hover:underline";

export function AdminNav() {
  return (
    <nav
      aria-label="Yönetim bölümleri"
      className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Bu sayfada</p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
        <Link href="/admin#ozet" className={activeClass}>
          Özet
        </Link>
        <Link href="/admin#populer" className={linkClass}>
          Popüler
        </Link>
        <Link href="/admin#hedefler" className={linkClass}>
          Hedef &amp; sağlayıcı
        </Link>
        <Link href="/admin#premium" className={linkClass}>
          Premium
        </Link>
        <Link href="/admin#kredi" className={linkClass}>
          Manuel kredi
        </Link>
        <Link href="/admin#son-uretim" className={linkClass}>
          Son üretimler
        </Link>
        <Link href="/admin#geri-bildirim" className={linkClass}>
          Geri bildirimler
        </Link>
        <Link href="/" className={`${linkClass} ml-auto`}>
          ← Site
        </Link>
      </div>
    </nav>
  );
}
