"use client";

import Link from "next/link";
import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Heart,
  Sparkles,
  X,
  Zap,
} from "lucide-react";

import type { AppProduct } from "@/lib/format";

// Anotasi Variants wajib supaya [0.16, 1, 0.3, 1] terbaca sebagai tuple
// cubic-bezier (bukan number[]) — kalau tidak, `next build` gagal saat
// typecheck. Pola ini sama dengan halaman /welcome.
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  },
};

const stagger: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.05 },
  },
};

const BRANDS = [
  "ATELIER NULL",
  "MAISON VOID",
  "CULT ROMA",
  "NEO ARCHIVE",
  "BLANC NOIR",
  "STUDIO 000",
  "RAF SYSTEM",
  "VETEMENT X",
];

// Kartu-kartu ini dipakai untuk hero float + fallback showcase saat DB kosong.
const GRADIENTS = [
  "from-pink-500 to-rose-700",
  "from-rose-400 to-pink-600",
  "from-fuchsia-500 to-rose-600",
  "from-pink-400 to-rose-500",
];

type Tile = {
  id: number;
  name: string;
  brand: string;
  price: number;
  imageUrl: string;
  tag?: string;
};

const FALLBACK_TILES: Tile[] = [
  { id: -1, name: "The Void Jacket", brand: "ATELIER NULL", price: 850, imageUrl: "", tag: "Archival" },
  { id: -2, name: "Null Trouser", brand: "MAISON VOID", price: 420, imageUrl: "", tag: "New" },
  { id: -3, name: "Monolith Coat", brand: "STUDIO 000", price: 1290, imageUrl: "", tag: "Rare" },
  { id: -4, name: "Erosion Knit", brand: "CULT ROMA", price: 360, imageUrl: "", tag: "New" },
  { id: -5, name: "Static Boot", brand: "RAF SYSTEM", price: 690, imageUrl: "", tag: "Drop" },
  { id: -6, name: "Blanc Shell", brand: "BLANC NOIR", price: 540, imageUrl: "", tag: "New" },
];

function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={className}>
      <span className="font-sans font-extrabold uppercase tracking-tight">
        SWIPE
      </span>
      <span className="font-serif italic font-light tracking-normal ml-0.5">
        Fash
      </span>
    </span>
  );
}

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-6 md:px-12 mix-blend-difference text-white">
      <Link href="/landing" className="text-2xl" data-testid="link-logo">
        <Wordmark />
      </Link>
      <Link
        href="/feed"
        className="group flex items-center gap-2 text-xs md:text-sm font-medium tracking-[0.15em] uppercase hover:opacity-70 transition-opacity"
        data-testid="link-nav-cta"
      >
        Start Swiping
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </Link>
    </nav>
  );
}

// Kartu demo yang otomatis "geser" kanan lalu kiri, mengulang terus.
function SwipeDemoCard() {
  return (
    <div className="relative w-[240px] h-[320px] md:w-[280px] md:h-[380px]">
      {/* tumpukan belakang */}
      <div className="absolute inset-0 translate-y-4 scale-95 rounded-2xl bg-card border border-border" />
      <div className="absolute inset-0 translate-y-2 scale-[0.975] rounded-2xl bg-card border border-border" />

      {/* kartu depan yang beranimasi */}
      <motion.div
        className="absolute inset-0 rounded-2xl overflow-hidden border border-border bg-gradient-to-br from-pink-500 to-rose-600 shadow-2xl"
        animate={{
          x: [0, 0, 260, 0, -260, 0],
          rotate: [0, 0, 16, 0, -16, 0],
          opacity: [1, 1, 0, 1, 0, 1],
        }}
        transition={{
          duration: 6,
          times: [0, 0.18, 0.34, 0.52, 0.68, 0.86],
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08),transparent_60%)]" />

        {/* stamp LIKE / NOPE */}
        <motion.span
          className="absolute top-6 left-6 rotate-[-12deg] rounded-md border-2 border-green-400 px-3 py-1 text-xs font-bold uppercase tracking-widest text-green-400"
          animate={{ opacity: [0, 0, 1, 0, 0, 0] }}
          transition={{
            duration: 6,
            times: [0, 0.18, 0.28, 0.4, 0.6, 1],
            repeat: Infinity,
          }}
        >
          Match
        </motion.span>
        <motion.span
          className="absolute top-6 right-6 rotate-[12deg] rounded-md border-2 border-red-400 px-3 py-1 text-xs font-bold uppercase tracking-widest text-red-400"
          animate={{ opacity: [0, 0, 0, 0, 1, 0] }}
          transition={{
            duration: 6,
            times: [0, 0.5, 0.55, 0.62, 0.72, 1],
            repeat: Infinity,
          }}
        >
          Pass
        </motion.span>

        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/60 mb-1">
            Maison Void
          </div>
          <div className="font-serif text-2xl text-white leading-tight">
            Null Trouser
          </div>
          <div className="mt-1 text-sm text-white/70 font-sans">$420</div>
        </div>
      </motion.div>
    </div>
  );
}

function Hero() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 800], [0, 200]);
  const fade = useTransform(scrollY, [0, 600], [1, 0]);

  return (
    <section className="relative min-h-screen w-full overflow-hidden flex items-center bg-background">
      {/* orbs / gradient ambient */}
      <motion.div style={{ y, opacity: fade }} className="absolute inset-0 z-0">
        <div className="absolute -top-40 -left-40 w-[36rem] h-[36rem] rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-[32rem] h-[32rem] rounded-full bg-rose-300/30 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,hsl(var(--background)))]" />
      </motion.div>

      <div className="relative z-20 container mx-auto px-6 md:px-12 pt-32 pb-20 grid lg:grid-cols-[1.1fr_0.9fr] gap-16 items-center">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="max-w-2xl"
        >
          <motion.span
            variants={fadeUp}
            className="inline-flex items-center gap-2 text-[11px] md:text-xs tracking-[0.3em] text-muted-foreground uppercase mb-8 font-sans"
          >
            <Sparkles className="w-3.5 h-3.5" />
            The new editorial
          </motion.span>
          <motion.h1
            variants={fadeUp}
            className="text-5xl md:text-7xl lg:text-8xl leading-[0.95] md:leading-[0.88] font-serif text-primary mb-8"
          >
            Swipe first.
            <br />
            <span className="italic text-muted-foreground">Regret</span> never.
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="text-lg md:text-xl text-muted-foreground max-w-lg font-light leading-relaxed mb-10"
          >
            The most dangerous curation algorithm in fashion. Editorial pieces
            meet the dopamine of a swipe — match with what you love, cop it in
            two taps.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-4">
            <Link
              href="/feed"
              className="inline-flex items-center justify-center h-14 px-9 bg-primary text-primary-foreground font-sans text-sm tracking-[0.18em] uppercase hover:scale-[1.03] transition-transform duration-300"
              data-testid="link-hero-cta"
            >
              Enter the experience
            </Link>
            <Link
              href="#how"
              className="inline-flex items-center gap-2 h-14 px-2 text-sm tracking-[0.14em] uppercase text-muted-foreground hover:text-primary transition-colors"
            >
              How it works
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, rotate: 4 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className="hidden lg:flex justify-center"
        >
          <SwipeDemoCard />
        </motion.div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-3 opacity-50">
        <span className="text-[10px] uppercase tracking-[0.2em] font-sans">
          Scroll
        </span>
        <div className="w-px h-10 bg-primary/40" />
      </div>
    </section>
  );
}

function BrandMarquee() {
  const row = [...BRANDS, ...BRANDS];
  return (
    <section className="py-8 border-y border-border bg-background overflow-hidden">
      <motion.div
        className="flex gap-16 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        {row.map((brand, i) => (
          <span
            key={i}
            className="text-sm md:text-base font-sans uppercase tracking-[0.25em] text-muted-foreground/70"
          >
            {brand}
          </span>
        ))}
      </motion.div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: <X className="w-7 h-7 text-red-400" />,
      title: "Swipe left",
      desc: "Pass. The feed learns what you hate and never wastes your time with it again.",
    },
    {
      icon: <Heart className="w-7 h-7 text-green-400" />,
      title: "Swipe right",
      desc: "Match. The piece drops straight into your personal lookbook, saved forever.",
    },
    {
      icon: <Zap className="w-7 h-7 text-yellow-400" />,
      title: "Two-tap cop",
      desc: "Lock it in before it's gone. Pick size and color, confirm, done.",
    },
  ];

  return (
    <section id="how" className="py-28 md:py-36 bg-background scroll-mt-20">
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-16 lg:gap-24 items-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            <motion.h2
              variants={fadeUp}
              className="text-4xl md:text-5xl font-serif mb-6 leading-[1.05]"
            >
              Instinct over{" "}
              <span className="italic text-muted-foreground">search.</span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="text-lg text-muted-foreground font-light leading-relaxed mb-10"
            >
              No endless grids. No bloated filters. Just you, the piece, and a
              split-second decision your gut already made.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col gap-5">
              {steps.map((s, i) => (
                <div key={i} className="flex items-start gap-5">
                  <div className="shrink-0 w-14 h-14 rounded-full border border-border bg-card flex items-center justify-center">
                    {s.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-sans font-semibold uppercase tracking-[0.12em] mb-1">
                      {s.title}
                    </h3>
                    <p className="text-muted-foreground font-light leading-relaxed">
                      {s.desc}
                    </p>
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="flex justify-center"
          >
            <SwipeDemoCard />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Showcase({ tiles }: { tiles: Tile[] }) {
  const row = [...tiles, ...tiles];
  return (
    <section className="py-24 md:py-32 bg-card border-y border-border overflow-hidden">
      <div className="container mx-auto px-6 md:px-12 mb-14">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <motion.h2
            variants={fadeUp}
            className="text-4xl md:text-5xl font-serif leading-[1.05] max-w-xl"
          >
            Curated drop{" "}
            <span className="italic text-muted-foreground">culture.</span>
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-muted-foreground font-light max-w-sm"
          >
            Sourced from underground ateliers and rare archives. No basics, no
            filler — if it&apos;s on SwipeFash, it&apos;s a statement.
          </motion.p>
        </motion.div>
      </div>

      <motion.div
        className="flex gap-6 px-6"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
        {row.map((t, i) => (
          <div
            key={`${t.id}-${i}`}
            className="group relative shrink-0 w-[260px] md:w-[300px] aspect-[3/4] rounded-lg overflow-hidden border border-border bg-background"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${
                GRADIENTS[i % GRADIENTS.length]
              }`}
            />
            {t.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={t.imageUrl}
                alt={t.name}
                className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            {t.tag ? (
              <span className="absolute top-4 right-4 px-2.5 py-1 bg-background/80 backdrop-blur-sm text-[10px] uppercase tracking-widest border border-border">
                {t.tag}
              </span>
            ) : null}
            <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/60 mb-1">
                {t.brand}
              </div>
              <div className="flex items-end justify-between gap-2">
                <span className="font-serif italic text-xl leading-tight">
                  {t.name}
                </span>
                <span className="font-sans text-sm tracking-wide">
                  ${Math.round(t.price)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </motion.div>
    </section>
  );
}

function Manifesto() {
  return (
    <section className="py-28 md:py-40 bg-background flex items-center justify-center">
      <div className="container mx-auto px-6 text-center max-w-3xl">
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="text-3xl md:text-5xl font-serif italic leading-tight text-primary"
        >
          &ldquo;We don&apos;t do seasons.
          <br />
          We do obsessions.&rdquo;
        </motion.p>
      </div>
    </section>
  );
}

function Stats() {
  const stats = [
    { value: "12k+", label: "Pieces curated" },
    { value: "2s", label: "Checkout time" },
    { value: "150+", label: "Exclusive brands" },
    { value: "0", label: "Compromises" },
  ];
  return (
    <section className="py-20 md:py-24 bg-card border-y border-border">
      <div className="container mx-auto px-6 md:px-12 grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-6 md:divide-x divide-border">
        {stats.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.6 }}
            className="flex flex-col items-center md:items-start md:pl-6 first:pl-0"
          >
            <span className="text-4xl md:text-5xl lg:text-6xl font-serif text-primary mb-2">
              {s.value}
            </span>
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-sans">
              {s.label}
            </span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function Features() {
  const items = [
    "Algorithmically personalized feed that sharpens with every swipe",
    "Exclusive pieces you won't find on the usual marketplaces",
    "Two-tap checkout — size, color, confirm",
    "Your matches saved to a private lookbook forever",
  ];
  return (
    <section className="py-24 md:py-32 bg-background">
      <div className="container mx-auto px-6 md:px-12 grid lg:grid-cols-2 gap-16 items-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
        >
          <motion.h2
            variants={fadeUp}
            className="text-4xl md:text-5xl font-serif mb-8 leading-[1.05]"
          >
            Built for the{" "}
            <span className="italic text-muted-foreground">chronically</span>{" "}
            stylish.
          </motion.h2>
          <motion.ul variants={stagger} className="flex flex-col gap-4">
            {items.map((text, i) => (
              <motion.li
                key={i}
                variants={fadeUp}
                className="flex items-start gap-4 text-primary/80 font-sans"
              >
                <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-primary/10 border border-border flex items-center justify-center">
                  <Check className="w-3 h-3" />
                </span>
                <span className="font-light leading-relaxed">{text}</span>
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative aspect-square rounded-2xl border border-border bg-gradient-to-br from-pink-500 to-rose-600 overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.07),transparent_60%)]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Wordmark className="text-4xl md:text-6xl text-white/90" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="relative py-32 md:py-44 bg-background overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(244,114,182,0.16),transparent_65%)]" />
      <div className="container mx-auto px-6 relative z-10 text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="max-w-2xl mx-auto flex flex-col items-center"
        >
          <motion.h2
            variants={fadeUp}
            className="text-5xl md:text-7xl font-serif mb-6 leading-[0.9]"
          >
            Ready to <span className="italic">match?</span>
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-lg text-muted-foreground font-light mb-12 max-w-md"
          >
            The grid is dead. Long live the swipe. Your next favorite piece is
            one gesture away.
          </motion.p>
          <motion.div variants={fadeUp}>
            <Link
              href="/feed"
              className="group inline-flex items-center gap-3 h-16 px-12 bg-primary text-primary-foreground font-sans text-sm tracking-[0.2em] uppercase hover:scale-[1.03] transition-transform duration-300"
              data-testid="link-final-cta"
            >
              Start swiping now
              <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-12 border-t border-border bg-background text-muted-foreground text-xs uppercase tracking-widest font-sans">
      <div className="container mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <Wordmark className="text-primary normal-case text-sm" />
        <div className="flex gap-8">
          <a href="#" className="hover:text-primary transition-colors">
            Instagram
          </a>
          <a href="#" className="hover:text-primary transition-colors">
            TikTok
          </a>
          <a href="#" className="hover:text-primary transition-colors">
            Twitter
          </a>
        </div>
        <div className="normal-case tracking-normal">
          &copy; {new Date().getFullYear()} SwipeFash Inc.
        </div>
      </div>
    </footer>
  );
}

export function LandingClient({ products }: { products: AppProduct[] }) {
  const tiles: Tile[] =
    products.length > 0
      ? products.map((p) => ({
          id: p.id,
          name: p.name,
          brand: p.brand,
          price: p.price,
          imageUrl: p.imageUrl,
          tag: p.isNew ? "New" : p.isSale ? "Sale" : undefined,
        }))
      : FALLBACK_TILES;

  return (
    <div className="bg-background text-foreground min-h-[100dvh] font-sans selection:bg-primary selection:text-primary-foreground">
      <Navbar />
      <main>
        <Hero />
        <BrandMarquee />
        <HowItWorks />
        <Showcase tiles={tiles} />
        <Manifesto />
        <Stats />
        <Features />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
