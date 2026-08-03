'use client';

import { useRef, useState } from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  useAnimation,
  useDragControls,
  useScroll,
  type PanInfo,
} from 'framer-motion';
import { categoryLabel, formatPrice, type AppProduct } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ShoppingBag, ThumbsUp, X } from 'lucide-react';

interface ProductCardProps {
  product: AppProduct;
  /** Geser kanan — memulai pembelian. Hanya lewat gestur, tidak ada tombolnya. */
  onSwipeRight: (product: AppProduct) => void;
  onSwipeLeft: (product: AppProduct) => void;
  /** Tombol いいね — menyimpan ke 一目惚れ. */
  onSuperLike: (product: AppProduct) => void;
  isFront: boolean;
}

// Satu baris di blok 基本情報: label abu-abu di kiri, nilai berwarna aksen di
// kanan. Mengikuti pola tabel profil aplikasi Jepang.
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-4 py-3 border-b border-border/60 last:border-0">
      <span className="w-28 shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="flex-1 text-sm text-primary">{value}</span>
    </div>
  );
}

export function ProductCard({
  product,
  onSwipeRight,
  onSwipeLeft,
  onSuperLike,
  isFront,
}: ProductCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const controls = useAnimation();
  const rotate = useTransform(x, [-200, 200], [-8, 8]);
  const likeOpacity = useTransform(x, [0, 50, 100], [0, 0, 1]);
  const nopeOpacity = useTransform(x, [0, -50, -100], [0, 0, 1]);
  // Membesar seiring geseran, jadi petunjuknya terasa MENGUAT saat kamu makin
  // yakin — bukan sekadar muncul lalu diam. Berhenti di 1 supaya tidak ada
  // lonjakan tepat sebelum kartu terlempar.
  const likeScale = useTransform(x, [0, 50, 100], [0.7, 0.8, 1]);
  const nopeScale = useTransform(x, [0, -50, -100], [0.7, 0.8, 1]);

  // Seluruh kartu kini satu wadah scroll: foto, gelembung, thumbnail, dan
  // panel teks berada di dalamnya. Menggulir dari mana pun — termasuk dari
  // atas foto — menaikkan panel putih sampai menutupi foto.
  const scrollRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: scrollRef });

  // Foto meredup dan sedikit mengecil saat panel naik, jadi peralihannya
  // terasa berlapis, bukan sekadar konten yang bergeser.
  const photoOpacity = useTransform(scrollYProgress, [0, 0.35], [1, 0.35]);
  const photoScale = useTransform(scrollYProgress, [0, 0.35], [1, 0.94]);

  // dragListener={false} mematikan penangkapan otomatis framer-motion; drag
  // hanya dimulai manual setelah kita memastikan gesturnya memang mendatar.
  const dragControls = useDragControls();

  // Satu gestur di atas foto bisa berarti dua hal: geser mendatar untuk
  // swipe, atau geser tegak untuk menggulir. Arahnya diputuskan sekali di
  // awal gestur, lalu tidak diubah lagi — kalau tidak, scroll bisa berubah
  // jadi swipe di tengah jalan.
  const gesture = useRef<{ x: number; y: number; decided: boolean } | null>(
    null,
  );

  const onPhotoPointerDown = (e: React.PointerEvent) => {
    if (!isFront) return;
    gesture.current = { x: e.clientX, y: e.clientY, decided: false };
  };

  const onPhotoPointerMove = (e: React.PointerEvent) => {
    const g = gesture.current;
    if (!g || g.decided) return;

    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    // Tunggu sampai gerakannya cukup jelas sebelum memutuskan arah.
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;

    g.decided = true;
    // Mendatar → serahkan ke drag. Tegak → dibiarkan, browser yang menggulir
    // (dimungkinkan oleh touch-action: pan-y pada elemen fotonya).
    if (Math.abs(dx) > Math.abs(dy)) dragControls.start(e);
  };

  const onPhotoPointerEnd = () => {
    gesture.current = null;
  };

  const images = product.images.length > 0 ? product.images : [product.imageUrl];
  const [photoIndex, setPhotoIndex] = useState(0);
  const currentImage = images[photoIndex] ?? images[0];

  const goTo = (i: number) =>
    setPhotoIndex(((i % images.length) + images.length) % images.length);

  const swipeThreshold = 100;

  // Sumbu tegak milik scroll, jadi geser ke atas tidak berarti apa-apa.
  // Geser kanan = memulai pembelian, geser kiri = lewat. Menyimpan ke
  // 一目惚れ dilakukan lewat tombol いいね, bukan gestur.
  const handleDragEnd = async (_e: unknown, info: PanInfo) => {
    const { offset, velocity } = info;

    if (offset.x > swipeThreshold || velocity.x > 500) {
      await controls.start({ x: 500, transition: { duration: 0.3 } });
      onSwipeRight(product);
    } else if (offset.x < -swipeThreshold || velocity.x < -500) {
      await controls.start({ x: -500, transition: { duration: 0.3 } });
      onSwipeLeft(product);
    } else {
      controls.start({
        x: 0,
        y: 0,
        rotate: 0,
        transition: { type: 'spring', stiffness: 300, damping: 20 },
      });
    }
  };

  // Tidak ada padanan tombol untuk geser kanan, dan itu disengaja: tombol
  // besar sekarang milik 一目惚れ. Membeli menuntut gestur — keputusan yang
  // paling berkonsekuensi jadi yang paling disengaja.
  //
  // Kartunya MENGECIL dan memudar, bukan melesat ke atas seperti sebelumnya.
  // Animasi terbang itu peninggalan saat 一目惚れ dilakukan dengan menggeser
  // kartu ke atas — gesturnya sudah lama hilang, dan kartu yang menembak ke
  // luar layar setelah tombol ditekan terbaca seperti sesuatu yang dibuang,
  // padahal artinya justru disimpan.
  //
  // Durasinya 0,2 detik, lebih pendek dari swipe (0,3), karena menekan tombol
  // tidak punya momentum yang perlu diselesaikan.
  const forceSuperLike = async () => {
    await controls.start({
      scale: 0.88,
      opacity: 0,
      transition: { duration: 0.2, ease: "easeIn" },
    });
    onSuperLike(product);
  };

  const dimensionEntries = Object.entries(product.dimensions);

  return (
    <motion.div
      className="absolute inset-0 pt-2"
      drag={isFront}
      dragListener={false}
      dragControls={dragControls}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      animate={controls}
      style={{ x, y, rotate }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {/* Wadah kartu kini transparan. Foto, strip thumbnail, dan panel teks
          jadi tiga blok terpisah yang mengambang di atas latar pink — bukan
          satu kotak putih penuh seperti sebelumnya. */}
      <div className="relative w-full h-full flex flex-col">
        {/* ---- Petunjuk arah swipe ----
             Dulu berupa stempel bertulisan 買う dan パス dengan bingkai tebal
             hijau/merah dan miring. Tiga hal salah di sana:

             - Hijau dan merah menjerit di atas palet coral aplikasi ini, dan
               merah membuat "lewati" terasa seperti kesalahan padahal ia
               keputusan yang wajar.
             - Teks harus dibaca. Petunjuk yang muncul di tengah gestur perlu
               dikenali dalam sekejap, dan ikon lebih cepat daripada kata.
             - Stempel miring itu bahasa visual aplikasi kencan, sedangkan
               kartu ini sudah bergerak menjauh dari sana.

             Sekarang: lingkaran kaca dengan ikon, muncul di sisi yang sedang
             kamu tuju. Bahasa yang sama dengan bilah navigasi mengambang. */}
        {/* Pemosisian dipisah ke elemen luar, animasi ke elemen dalam.
            Keduanya tidak boleh disatukan: `-translate-y-1/2` dari Tailwind dan
            `scale` dari framer-motion sama-sama menulis properti `transform`,
            dan yang belakangan menimpa yang pertama — lingkarannya akan
            melompat ke bawah begitu mulai membesar. */}
        {/* Label memakai 見送る, BUKAN パス — kata itu sudah dipakai di
            スタイルDNA (「見送るもの」) dan di lencana 足あと. Dua nama untuk
            satu tindakan membuat aplikasi terbaca tidak rapi.

            購入へ, bukan 買う: geser kanan tidak langsung membeli, ia MENUJU
            pembelian lewat pemilihan ukuran. Partikel へ menyampaikan itu. */}
        <div className="absolute top-1/2 -translate-y-1/2 right-6 z-40 pointer-events-none">
          <motion.div
            className="flex flex-col items-center gap-2"
            style={{ opacity: likeOpacity, scale: likeScale }}
          >
            <span className="w-16 h-16 rounded-full bg-white/85 backdrop-blur-md border border-white/70 shadow-lg flex items-center justify-center">
              <ShoppingBag className="w-7 h-7 text-primary" />
            </span>
            <span className="px-3 py-1 rounded-full bg-white/85 backdrop-blur-md text-primary text-xs font-bold shadow-sm">
              購入へ
            </span>
          </motion.div>
        </div>
        <div className="absolute top-1/2 -translate-y-1/2 left-6 z-40 pointer-events-none">
          <motion.div
            className="flex flex-col items-center gap-2"
            style={{ opacity: nopeOpacity, scale: nopeScale }}
          >
            <span className="w-16 h-16 rounded-full bg-white/85 backdrop-blur-md border border-white/70 shadow-lg flex items-center justify-center">
              <X className="w-7 h-7 text-muted-foreground" />
            </span>
            <span className="px-3 py-1 rounded-full bg-white/85 backdrop-blur-md text-muted-foreground text-xs font-bold shadow-sm">
              見送る
            </span>
          </motion.div>
        </div>
        {/* ---- Wadah scroll tunggal: foto, gelembung, thumbnail, panel ---- */}
        {/* overflow-x-hidden WAJIB, bukan sekadar rapi. Menyetel overflow-y
            saja membuat overflow-x ikut jadi `auto` menurut spesifikasi CSS —
            dan panah foto sengaja menjorok setengah lingkaran keluar tepi
            kartu, jadi wadah ini punya isi yang lebih lebar dari dirinya.
            Akibatnya kartu bisa digeser MENDATAR seperti scrollbar: foto,
            thumbnail, dan panel putih bergeser ke kiri sementara tombol aksi
            — yang berada di luar wadah ini — tetap di tempat, dan tata
            letaknya tampak rusak. */}
        <div
          ref={scrollRef}
          className="h-full overflow-y-auto overflow-x-hidden overscroll-none scrollbar-none"
        >
        {/* ---- Foto: geser mendatar = swipe, geser tegak = scroll ----
             touch-pan-y memberi tahu browser bahwa gestur tegak di sini boleh
             menggulir; tanpa itu browser menahan scroll dan hanya drag yang
             jalan. */}
        <motion.div
          className="relative h-[42%] shrink-0 touch-pan-y"
          style={{ opacity: photoOpacity, scale: photoScale }}
          onPointerDown={onPhotoPointerDown}
          onPointerMove={onPhotoPointerMove}
          onPointerUp={onPhotoPointerEnd}
          onPointerCancel={onPhotoPointerEnd}
        >
          <div className="relative h-full mx-6 rounded-[1.75rem] overflow-hidden bg-muted shadow-lg">
            {/* next/image, bukan <img>: foto aslinya 1024x1024 dan bisa 276 KB,
                padahal di ponsel hanya dirender selebar layar. Next mengecilkan
                dan mengubahnya ke WebP/AVIF sesuai perangkat. priority dipakai
                karena ini gambar terbesar yang pertama terlihat — menundanya
                justru membuat kartu terasa lambat dimuat. */}
            <Image
              src={currentImage}
              alt={product.name}
              fill
              sizes="(max-width: 448px) 100vw, 448px"
              priority
              className="object-cover select-none"
              draggable={false}
            />

            <div className="absolute top-4 right-4 flex gap-2 z-30">
              {product.isNew && (
                <Badge className="bg-white text-black hover:bg-white border-0 shadow">NEW</Badge>
              )}
              {product.isSale && (
                <Badge variant="destructive" className="shadow">
                  SALE
                </Badge>
              )}
            </div>
          </div>

          {/* Panah setengah lingkaran TERJEPIT DI TEPI LAYAR seperti aplikasi
              rujukan — bukan lingkaran kecil di tepi foto. -translate-x-1/2
              mendorong separuhnya keluar kartu; overflow-hidden pada wadah
              feed yang memotongnya jadi setengah lingkaran. */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                aria-label="前の写真"
                data-testid="button-photo-prev"
                // stopPropagation di pointerDown penting: tanpa ini tombol ikut
                // memicu dragControls.start dan tap-nya terbaca sebagai swipe.
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => goTo(photoIndex - 1)}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-30 w-16 h-16 rounded-full bg-white/45 backdrop-blur-sm flex items-center justify-center text-white"
              >
                <ChevronLeft className="w-6 h-6 ml-6" />
              </button>
              <button
                type="button"
                aria-label="次の写真"
                data-testid="button-photo-next"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => goTo(photoIndex + 1)}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-30 w-16 h-16 rounded-full bg-white/45 backdrop-blur-sm flex items-center justify-center text-white"
              >
                <ChevronRight className="w-6 h-6 mr-6" />
              </button>
            </>
          )}
        </motion.div>

        {/* ---- Gelembung ucapan dengan ekor segitiga, seperti caption foto di
             aplikasi rujukan.

             Diisi `feel` — satu kalimat tentang rasa memakainya. Dulu diisi
             `material`, karena saat itu itulah satu-satunya kolom yang cukup
             pendek untuk jadi caption. Tapi gelembung ini yang menyapa orang
             lebih dulu di feed, dan「ウール95% / ポリウレタン5%」tidak
             memberi tahu apa pun soal bagaimana rasanya dipakai. Komposisi
             bahannya tetap ada di blok 基本情報 di bawah, tempat orang
             mencarinya saat memang ingin tahu.

             Jatuh kembali ke material kalau feel kosong, supaya produk lama
             yang belum diisi tidak kehilangan captionnya sama sekali. ---- */}
        {(product.feel || product.material) && (
          // flex justify-center membuat lebar gelembung mengikuti teksnya,
          // bukan membentang selebar layar untuk isi sependek「シルク100%」.
          <div className="relative z-10 mt-2 flex justify-center pointer-events-none">
            <div className="relative bg-pink-50/95 rounded-full px-7 py-2.5 shadow-sm max-w-[88%]">
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-pink-50/95 rotate-45" />
              <span className="block text-sm text-foreground/80 text-center leading-snug">
                {product.feel ?? product.material}
              </span>
            </div>
          </div>
        )}

        {/* ---- Strip thumbnail besar di atas gradasi ---- */}
        {images.length > 1 && (
          // gap-5 dan tanpa scale: ring digambar DI LUAR kotak tanpa
          // memengaruhi tata letak, jadi ring + scale pada thumbnail aktif
          // sebelumnya menimpa thumbnail di sebelahnya. Ring dikecilkan ke
          // 3px dan jaraknya dilebarkan supaya tiap preview bernapas.
          // justify-center: strip diletakkan di tengah, sejajar dengan foto
          // besar dan gelembung bahan di atasnya. Rata kiri membuatnya
          // terlihat seperti sisa tata letak, bukan bagian dari kartu.
          //
          // Aman dipadukan dengan overflow-x-auto di sini karena jumlah foto
          // dibatasi enam — pada lebar ponsel pun barisnya tidak sampai
          // melampaui layar, jadi tidak ada thumbnail yang terdorong keluar
          // jangkauan gulir.
          <div
            className="shrink-0 flex justify-center gap-4 px-6 py-3.5 overflow-x-auto"
            onPointerDown={(e) => e.stopPropagation()}
          >
            {images.map((src, i) => (
              <button
                key={`${src}-${i}`}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`写真 ${i + 1}`}
                className={cn(
                  'relative shrink-0 w-14 h-14 rounded-xl overflow-hidden transition',
                  i === photoIndex
                    ? 'ring-2 ring-white shadow-md'
                    : 'opacity-85',
                )}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="56px"
                  className="object-cover"
                  draggable={false}
                />
              </button>
            ))}
          </div>
        )}

        {/* ---- Panel teks putih ----
             Tata letak header meniru aplikasi rujukan: nama tebal sans (bukan
             serif — heading di globals.css otomatis serif, jadi di-override),
             baris status dengan titik hijau, lalu harga besar berwarna aksen.

             min-h-full menjamin panel selalu bisa naik sampai memenuhi layar,
             meski isi 基本情報 pendek. Tanpa itu, produk dengan sedikit baris
             ukuran tidak akan pernah bisa menutupi fotonya. */}
        <div
          // pb-44 (176px) bukan angka sembarangan — ia dihitung dari apa yang
          // mengambang di atasnya:
          //
          //   tombol いいね！ : bottom-24 (96px) + tinggi h-12 (48px) = 144px
          //   jarak napas     : 32px
          //                     ------------------------------------------
          //                                                        176px
          //
          // Sebelumnya pb-32 (128px), lebih pendek dari tombolnya sendiri,
          // sehingga baris terakhir tabel 基本情報 selalu tertutup saat
          // digulir sampai bawah.
          //
          // Kalau tinggi atau posisi tombol diubah, angka ini harus ikut.
          className="relative min-h-full bg-card rounded-t-[2rem] px-6 pt-7 pb-44"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-sans font-bold text-2xl leading-snug tracking-normal">
              {product.name}
            </h2>
            {(product.isNew || product.isSale) && (
              <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5">
                ✦ {product.isSale ? 'セール中' : '新着'}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground tracking-[0.15em] mt-0.5 mb-2">
            {product.brand}
          </p>

          <div className="flex items-center gap-1.5 mb-3">
            <span
              className={cn(
                'w-2.5 h-2.5 rounded-full',
                product.stock > 0 ? 'bg-green-500' : 'bg-muted-foreground/40',
              )}
            />
            <span className="text-sm text-muted-foreground">
              {product.stock > 0 ? `在庫あり・残り${product.stock}点` : '在庫切れ'}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="font-sans font-bold text-3xl text-primary tabular-nums">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>

          {/* Pemisah tipis antar blok. Warnanya diambil dari --border dengan
              opasitas rendah supaya terbaca sebagai jeda, bukan sebagai garis
              tabel. */}
          <div className="h-px bg-border/70 my-6" />

          <h3 className="font-sans font-bold text-lg tracking-normal mb-2">
            商品説明
          </h3>
          <p className="text-[15px] leading-relaxed text-foreground/80">
            {product.description}
          </p>

          <div className="h-px bg-border/70 my-6" />

          <h3 className="font-sans font-bold text-lg tracking-normal mb-1">
            基本情報
          </h3>
          <div>
            <InfoRow label="カテゴリー" value={categoryLabel(product.category)} />
            <InfoRow label="ブランド" value={product.brand} />
            {product.material && <InfoRow label="素材" value={product.material} />}
            {product.colors.length > 0 && (
              <InfoRow label="カラー" value={product.colors.join('・')} />
            )}
            {product.sizes.length > 0 && (
              <InfoRow label="サイズ展開" value={product.sizes.join('・')} />
            )}
            {dimensionEntries.map(([label, value]) => (
              <InfoRow key={label} label={label} value={value} />
            ))}
            {product.rating !== null && (
              <InfoRow
                label="評価"
                value={`${product.rating.toFixed(1)}（${product.reviewCount}件）`}
              />
            )}
            <InfoRow
              label="在庫"
              value={product.stock > 0 ? `残り${product.stock}点` : '在庫切れ'}
            />
          </div>
        </div>
        </div>

        {/* ---- Satu tombol saja.
             Pembagiannya sekarang bersih: GESTUR untuk memilah, TOMBOL untuk
             menyimpan. Geser kanan membeli, geser kiri melewati, dan tombol
             いいね！menyimpan ke 一目惚れ.

             × dan ★ sama-sama dihapus. Keduanya cuma menduplikasi sesuatu
             yang sudah bisa dilakukan — dan tiga tombol berjajar membuat
             orang menimbang pilihan alih-alih bereaksi, padahal reaksi cepat
             itulah inti dari antarmuka swipe. ---- */}
        {isFront && (
          <div
            className="absolute bottom-24 left-4 right-4 z-30 flex justify-center"
            onPointerDown={(e) => e.stopPropagation()}
          >
            {/* Dibatasi max-w supaya tidak membentang penuh di layar lebar. */}
            <Button
              className="relative w-full max-w-[260px] h-12 rounded-full bg-primary text-primary-foreground text-base font-bold shadow-lg shadow-primary/30 hover:bg-primary/90 transition"
              onClick={forceSuperLike}
              data-testid="button-like"
              aria-label="一目惚れに保存"
            >
              <span className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
                <ThumbsUp className="w-5 h-5 fill-current" />
              </span>
              いいね！
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
