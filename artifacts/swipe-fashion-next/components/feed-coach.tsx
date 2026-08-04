"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, ThumbsUp, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Panduan gestur, ditampilkan sekali pada kunjungan pertama ke feed.
 *
 * KENAPA INI PERLU. Halaman pemasaran sudah dihapus, jadi orang mendarat
 * langsung di kartu pertama tanpa satu kalimat pun yang menjelaskan apa yang
 * harus dilakukan. Untuk aplikasi yang seluruh interaksinya satu gerakan,
 * salah tebak di kartu pertama itu mahal: geser kanan langsung membuka
 * pemesanan.
 *
 * Dibuat BERTAHAP, bukan satu layar berisi tiga instruksi sekaligus. Tiga
 * penjelasan berdampingan menuntut orang membaca semuanya sebelum boleh
 * menyentuh apa pun — padahal inti aplikasi ini justru reaksi cepat. Satu
 * gerakan per layar, masing-masing diperagakan.
 */

const SEEN_KEY = "hitome:feed-coach-seen";

// SEMENTARA — panduan muncul setiap kali feed dibuka, supaya mudah ditinjau
// tanpa perlu menghapus localStorage lewat console tiap kali.
//
// SETEL KE false SEBELUM RILIS. Kalau dibiarkan true, pengguna sungguhan akan
// dihadang panduan ini di SETIAP kunjungan — bukan cuma yang pertama.
const ALWAYS_SHOW = true;

type Step = {
  id: string;
  /**
   * Arah kartu terbang keluar: 1 kanan, -1 kiri, 0 tidak digeser.
   *
   * Kartu asli TIDAK kembali ke tengah setelah melewati ambang — ia melesat
   * keluar layar (`controls.start({ x: 500 })` di product-card.tsx). Peragaan
   * sebelumnya memantulkannya kembali, yang mengajarkan gerakan yang tidak
   * pernah terjadi.
   */
  dir: -1 | 0 | 1;
  icon: typeof Heart;
  /** Ikon padat terbaca lebih tegas di lencana kecil. */
  filled?: boolean;
  accent: string;
  glow: string;
  label: string;
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    id: "right",
    dir: 1,
    icon: Heart,
    filled: true,
    // Koral milik aplikasi (--primary), bukan rose-500 bawaan Tailwind.
    // rose-500 terlalu pekat dan tidak ada di palet mana pun di sini; koral
    // ini warna yang sama dengan tombol いいね！, harga, dan lencana 新着 —
    // jadi hatinya terbaca sebagai bagian aplikasi, bukan ikon tempelan.
    accent: "text-primary",
    glow: "from-primary/40",
    label: "右にスワイプ",
    title: "気になったら、右へ。",
    // Disebut eksplisit bahwa ini membuka pemesanan. Ini gerakan yang paling
    // mahal kalau salah tebak, jadi tidak boleh disamarkan jadi "suka".
    body: "サイズとカラーを選ぶ画面がひらきます。そのまま注文まで進めます。",
  },
  {
    id: "left",
    dir: -1,
    icon: X,
    // Netral, bukan merah. Merah kini milik langkah kanan (hati), dan dua
    // langkah berwarna sama menghapus petunjuk warna yang membedakan arah.
    accent: "text-slate-600",
    glow: "from-slate-300/40",
    label: "左にスワイプ",
    title: "ちがえば、左へ。",
    body: "見送った一着も記録されます。次に出てくる服が、少しずつ変わります。",
  },
  {
    id: "save",
    dir: 0,
    icon: ThumbsUp,
    accent: "text-primary",
    glow: "from-primary/40",
    label: "いいね！",
    title: "迷ったら、保存。",
    body: "「一目惚れ」に残ります。あとからゆっくり選べます。",
  },
];

export function FeedCoach({ previewImage }: { previewImage?: string }) {
  // null = belum diperiksa. Membedakannya dari false mencegah panduan
  // berkedip sekilas pada orang yang sudah pernah melihatnya.
  const [isOpen, setIsOpen] = useState<boolean | null>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (ALWAYS_SHOW) {
      setIsOpen(true);
      return;
    }

    try {
      setIsOpen(!localStorage.getItem(SEEN_KEY));
    } catch {
      // Safari mode privat melempar saat localStorage disentuh. Panduan bukan
      // hal yang layak merusak halaman — anggap saja sudah pernah dilihat.
      setIsOpen(false);
    }
  }, []);

  const close = () => {
    // Penanda tetap ditulis meski ALWAYS_SHOW aktif. Jadi begitu bendera itu
    // dimatikan, perilakunya langsung benar tanpa perlu diuji ulang.
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* abaikan — lihat alasan di atas */
    }
    setIsOpen(false);
    setIndex(0);
  };

  if (!isOpen) return null;

  const step = STEPS[index];
  const isLast = index === STEPS.length - 1;
  const Icon = step.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      // absolute, bukan fixed: panduan harus tinggal di dalam bingkai ponsel.
      className="absolute inset-0 z-50 flex flex-col items-center justify-center px-8 bg-foreground/55 backdrop-blur-md"
    >
      <button
        type="button"
        onClick={close}
        className="absolute top-[calc(env(safe-area-inset-top)+1rem)] right-5 text-xs tracking-widest uppercase text-white/70 hover:text-white transition-colors"
      >
        スキップ
      </button>

      {/* ---- Peragaan ----

          Langkah いいね！ TIDAK memakai kartu produk.
          Yang diajarkan di sini bukan gerakan pada kartu, melainkan sebuah
          TOMBOL — jadi yang diperagakan tombolnya sendiri, ditiru semirip
          mungkin dengan yang ada di feed. Menampilkan kartu di sini justru
          menyesatkan: orang akan mengira ada gestur yang harus dilakukan
          padanya. */}
      {step.dir === 0 ? (
        <div className="relative flex items-center justify-center h-[200px] mb-10">
          <div
            className={cn(
              "absolute -inset-10 rounded-full blur-2xl bg-gradient-to-t to-transparent",
              step.glow,
            )}
          />
          <motion.div
            key={step.id}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: [1, 0.94, 1], opacity: 1 }}
            transition={{
              duration: 1.4,
              times: [0, 0.4, 1],
              repeat: Infinity,
              repeatDelay: 0.5,
              ease: "easeInOut",
            }}
            // Ditiru dari tombol asli di product-card.tsx: pil penuh, warna
            // aksen, ikon jempol menempel di kiri.
            className="relative w-[220px] h-12 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center font-bold"
          >
            <span className="absolute left-4 top-1/2 -translate-y-1/2">
              <ThumbsUp className="w-5 h-5 fill-current" />
            </span>
            いいね！
          </motion.div>
        </div>
      ) : (
      <div className="relative w-[150px] h-[200px] mb-10">
        {/* Cahaya arah di belakang kartu. Ia yang membuat arah terbaca bahkan
            sebelum kartunya bergerak. */}
        <div
          className={cn(
            "absolute -inset-8 rounded-full blur-2xl to-transparent",
            step.glow,
            step.dir > 0 ? "bg-gradient-to-r" : "bg-gradient-to-l",
          )}
        />

        {/* Lencana DI TENGAH, di belakang kartu.

            Dulu ia menempel di sisi kiri/kanan, dan kartu yang melintas
            menutupinya tepat saat ia paling perlu terlihat. Sekarang ia
            tersembunyi persis di balik kartu, lalu TERSINGKAP oleh kartu yang
            menggeser pergi — jadi gerakan kartu dan kemunculan ikonnya jadi
            satu peristiwa, bukan dua hal yang saling menimpa.

            Waktunya digeser ke 0,55 — sesudah kartu melewati titik 0,45 dan
            benar-benar mulai menyingkir. Kalau lebih awal, ikonnya menyala di
            balik kartu yang masih menutupinya. */}
        <motion.span
          key={`${step.id}-badge`}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: [0, 0, 1, 1], scale: [0.7, 0.7, 1, 1] }}
          transition={{
            duration: 1.8,
            times: [0, 0.35, 0.62, 1],
            repeat: Infinity,
            repeatDelay: 0.4,
            ease: "easeOut",
          }}
          className={cn(
            "absolute z-0 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/90 backdrop-blur-md shadow-lg flex items-center justify-center",
            step.accent,
          )}
        >
          <Icon
            className={cn("w-8 h-8", step.filled && "fill-current")}
            strokeWidth={2.5}
          />
        </motion.span>

        {/* TANPA AnimatePresence.

            Sebelumnya kartu ini dibungkus <AnimatePresence mode="wait">, dan
            itu membuatnya HILANG sama sekali mulai langkah kedua: mode="wait"
            menahan pemasangan elemen baru sampai animasi keluar elemen lama
            selesai — sementara animasi kartu ini `repeat: Infinity` dan tidak
            pernah selesai. AnimatePresence menunggu selamanya.

            Tidak ada yang hilang dengan membuangnya: `key` sudah memaksa
            React memasang ulang kartu tiap ganti langkah, dan `initial`
            menangani kemunculannya. */}
        <motion.div
          key={step.id}
          className="absolute inset-0 z-10 rounded-2xl overflow-hidden bg-card shadow-2xl"
          initial={{ opacity: 0, scale: 0.9 }}
          // Meniru kartu asli: rotasi mengikuti geseran (±8° pada 200px),
          // lalu melesat keluar dan memudar. Ia TIDAK kembali ke tengah.
          animate={{
            opacity: [1, 1, 0],
            scale: 1,
            x: [0, step.dir * 60, step.dir * 320],
            rotate: [0, step.dir * 2.5, step.dir * 12],
          }}
          transition={{
            duration: 1.8,
            times: [0, 0.45, 1],
            repeat: Infinity,
            repeatDelay: 0.4,
            ease: "easeIn",
          }}
        >
          {previewImage ? (
            <Image
              src={previewImage}
              alt=""
              fill
              sizes="150px"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted" />
          )}
        </motion.div>
      </div>
      )}

      {/* ---- Teks ---- */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="text-center max-w-[280px]"
        >
          <span className="inline-block text-[10px] tracking-[0.25em] uppercase text-white/60 mb-3">
            {step.label}
          </span>
          <h2 className="font-serif text-2xl text-white mb-3 leading-snug">
            {step.title}
          </h2>
          <p className="text-sm text-white/75 leading-relaxed">{step.body}</p>
        </motion.div>
      </AnimatePresence>

      {/* ---- Titik langkah ---- */}
      <div className="flex items-center gap-2 mt-8 mb-6">
        {STEPS.map((s, i) => (
          <span
            key={s.id}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === index ? "w-6 bg-white" : "w-1.5 bg-white/35",
            )}
          />
        ))}
      </div>

      <Button
        onClick={() => (isLast ? close() : setIndex((i) => i + 1))}
        className="h-12 w-full max-w-[240px] rounded-full bg-white text-foreground font-bold hover:bg-white/90"
      >
        {isLast ? "はじめる" : "次へ"}
      </Button>
    </motion.div>
  );
}
