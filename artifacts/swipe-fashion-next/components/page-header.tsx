import type { LucideIcon } from "lucide-react";

/**
 * Header halaman bersama untuk 探す / 一目惚れ / バッグ.
 *
 * Sebelumnya tiap halaman hanya punya <h1> serif mengambang di latar polos —
 * terbaca seperti dokumen, bukan aplikasi, dan kontras sekali dengan kartu
 * feed yang sudah rapi. Beberapa keputusan di sini:
 *
 * - Blok bergradasi dengan sudut bawah membulat memberi halaman "atap",
 *   sehingga daftar di bawahnya terasa berlabuh, bukan melayang.
 * - Judul memakai sans tebal, bukan serif. Playfair tidak punya glif Jepang,
 *   jadi 探す jatuh ke Noto Serif dan bercampur dengan angka/Latin di sekitarnya
 *   — campuran itu yang membuatnya terlihat seperti teks mentah.
 * - Ikon dalam bulatan memberi tiap halaman jangkar visual yang langsung
 *   dikenali, sekaligus menyamakan bahasa dengan kartu Style DNA.
 * - Hitungan ditampilkan sebagai pil, bukan kalimat: angka yang bisa dipindai
 *   sekilas lebih berguna daripada "3 件のアイテム" yang harus dibaca.
 */
export function PageHeader({
  icon: Icon,
  eyebrow,
  title,
  subtitle,
  count,
  countLabel = "件",
  children,
}: {
  icon: LucideIcon;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  count?: number;
  countLabel?: string;
  // Slot untuk kontrol yang menempel pada header, mis. tab kategori di 探す.
  children?: React.ReactNode;
}) {
  return (
    <header className="relative bg-gradient-to-b from-primary/12 via-primary/5 to-transparent pt-9 pb-5 rounded-b-[2rem]">
      <div className="px-6">
        <div className="flex items-start gap-3.5">
          <span className="w-12 h-12 shrink-0 rounded-2xl bg-primary/15 flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary" />
          </span>

          <div className="min-w-0 flex-1">
            {eyebrow && (
              <p className="text-[10px] tracking-[0.2em] text-primary/80 mb-1">
                {eyebrow}
              </p>
            )}
            <div className="flex items-center gap-2.5">
              <h1 className="font-sans font-bold text-3xl tracking-normal leading-none">
                {title}
              </h1>
              {count !== undefined && count > 0 && (
                <span className="shrink-0 rounded-full bg-primary/15 text-primary text-xs font-bold px-2.5 py-1 tabular-nums">
                  {count}
                  {countLabel}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      {children}
    </header>
  );
}
