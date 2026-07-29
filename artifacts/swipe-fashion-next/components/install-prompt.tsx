"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

/**
 * Ajakan memasang aplikasi ke home screen.
 *
 * Ada karena tanpa ini hampir tidak ada yang tahu aplikasinya bisa dipasang —
 * Android menyembunyikan opsinya di menu tiga titik, dan iOS lebih dalam lagi.
 * Untuk penilaian lomba, itu berarti fitur yang tidak pernah terlihat.
 *
 * Dua jalur berbeda karena browsernya memang berbeda:
 *
 * - Chrome/Edge/Android menembakkan event `beforeinstallprompt`. Event itu
 *   ditahan, lalu dipanggil ulang saat tombol ditekan — pemasangan terjadi di
 *   dalam aplikasi, sekali ketuk.
 * - Safari iOS TIDAK punya event itu sama sekali. Satu-satunya cara adalah
 *   pengguna menekan Share lalu「ホーム画面に追加」. Jadi di iOS yang bisa
 *   dilakukan hanyalah menampilkan instruksinya.
 */

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "swipefash:install-dismissed";

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<InstallEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Sudah berjalan sebagai aplikasi terpasang — tidak ada yang perlu ditawarkan.
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // Properti khusus Safari iOS; tidak ada di tipe Navigator standar.
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true;
    if (standalone) return;

    if (sessionStorage.getItem(DISMISS_KEY)) return;

    const ua = window.navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) && !/CriOS|FxiOS/.test(ua);
    setIsIos(ios);

    if (ios) {
      // Tidak ada event yang bisa ditunggu di iOS; tampilkan instruksinya.
      setIsVisible(true);
      return;
    }

    const onPrompt = (e: Event) => {
      // Wajib: tanpa ini Chrome menampilkan banner bawaannya sendiri dan event
      // tidak bisa dipakai ulang nanti.
      e.preventDefault();
      setDeferred(e as InstallEvent);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const dismiss = () => {
    // sessionStorage, bukan localStorage: ajakan muncul lagi di kunjungan
    // berikutnya. Untuk demo lomba itu justru yang diinginkan — juri berikutnya
    // tetap melihatnya.
    sessionStorage.setItem(DISMISS_KEY, "1");
    setIsVisible(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setIsVisible(false);
  };

  if (!isVisible) return null;

  // iOS: tidak ada tombol yang bisa disediakan, jadi kartunya harus jelas
  // TERBACA sebagai instruksi. Versi sebelumnya berbentuk kartu ringkas mirip
  // tombol dan justru membuat orang mencoba menekannya.
  if (isIos) {
    return (
      <div className="absolute bottom-3 left-3 right-3 z-50 rounded-2xl bg-foreground text-background shadow-2xl p-4">
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 shrink-0 rounded-xl bg-primary flex items-center justify-center">
            <Download className="w-5 h-5 text-primary-foreground" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold leading-tight">
              アプリとして使えます
            </p>
            <p className="text-[11px] opacity-60 leading-snug mt-0.5">
              下の手順でホーム画面に追加してください
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="閉じる"
            className="shrink-0 w-8 h-8 -mt-1 -mr-1 rounded-full flex items-center justify-center opacity-60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Langkah bernomor, bukan satu kalimat: pengguna harus tahu ini
            sesuatu yang DIA lakukan di Safari, bukan di dalam aplikasi. */}
        <ol className="mt-3 space-y-2 border-t border-background/15 pt-3">
          <li className="flex items-center gap-2.5 text-xs">
            <span className="w-5 h-5 shrink-0 rounded-full bg-background/15 flex items-center justify-center text-[10px] font-bold">
              1
            </span>
            <span className="flex items-center gap-1.5">
              Safari 下部の
              <Share className="w-4 h-4 inline shrink-0" />
              を押す
            </span>
          </li>
          <li className="flex items-center gap-2.5 text-xs">
            <span className="w-5 h-5 shrink-0 rounded-full bg-background/15 flex items-center justify-center text-[10px] font-bold">
              2
            </span>
            <span>「ホーム画面に追加」を選ぶ</span>
          </li>
        </ol>
      </div>
    );
  }

  // Android/Chrome: ada API-nya, jadi pemasangan bisa satu ketuk di sini.
  return (
    <div className="absolute bottom-3 left-3 right-3 z-50 rounded-2xl bg-foreground text-background shadow-2xl px-4 py-3 flex items-center gap-3">
      <span className="w-10 h-10 shrink-0 rounded-xl bg-primary flex items-center justify-center">
        <Download className="w-5 h-5 text-primary-foreground" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold leading-tight">ホーム画面に追加</p>
        <p className="text-xs opacity-70 leading-snug mt-0.5">
          アプリとして全画面で使えます
        </p>
      </div>

      <button
        type="button"
        onClick={install}
        data-testid="button-install"
        className="shrink-0 h-9 px-4 rounded-full bg-primary text-primary-foreground text-sm font-bold"
      >
        追加
      </button>

      <button
        type="button"
        onClick={dismiss}
        aria-label="閉じる"
        className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center opacity-60 hover:opacity-100"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
