/**
 * Layar pembuka sekejap saat aplikasi pertama kali dimuat.
 *
 * SENGAJA TANPA JAVASCRIPT. Seluruhnya animasi CSS, dan itu keputusan
 * pentingnya:
 *
 * - Ia sudah terlihat pada cat pertama, sebelum React sempat hidup. Splash
 *   yang menunggu JavaScript justru muncul setelah momen yang mau ditutupinya
 *   sudah lewat — layar putih kosong dulu, baru logo. Terbalik.
 * - Ia tetap menghilang meski JavaScript gagal dimuat. Overlay layar penuh
 *   yang bergantung pada JS untuk menutup diri adalah cara paling pasti
 *   mengunci pengguna di luar aplikasi.
 *
 * Dipasang di root layout, jadi ia hidup sekali per pemuatan halaman.
 * Berpindah antar tab tidak memicunya lagi — layout tidak dipasang ulang.
 *
 * `pointer-events-none` menyala sejak awal: selama 0,9 detik itu pengguna
 * sudah boleh mengetuk apa pun di baliknya. Splash ini hiasan, bukan gerbang.
 */
export function Splash() {
  return (
    <div
      aria-hidden="true"
      className="splash fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background pointer-events-none"
    >
      <div className="splash-mark flex flex-col items-center">
        {/* Dua kotak coral bertumpuk miring dengan centang — bahasa visual
            yang sama dengan ikon home screen di scripts/generate-pwa-icons.py,
            supaya ikon yang diketuk dan layar yang muncul terasa satu benda. */}
        <span className="relative w-[72px] h-[72px] mb-5">
          <span className="absolute inset-0 rounded-[18px] bg-primary/35 -rotate-12" />
          <span className="absolute inset-0 rounded-[18px] bg-primary rotate-6 flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-8 h-8 text-primary-foreground -rotate-6"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
        </span>

        <p className="font-sans font-bold text-2xl tracking-tight">
          SwipeFash
        </p>
        <p className="text-xs text-muted-foreground mt-1.5 tracking-wide">
          スワイプで出会う、次の一着。
        </p>
      </div>
    </div>
  );
}
