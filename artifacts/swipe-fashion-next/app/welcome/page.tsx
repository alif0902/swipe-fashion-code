'use client';

import React from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, type Variants } from 'framer-motion';
import { ArrowRight, MoveRight, MoveLeft, Heart, X, Zap, Smartphone, CheckCircle2, ShieldCheck, Flame } from 'lucide-react';

// Alias @assets tidak ada di Next. Gambar-gambar ini sekarang berada di
// public/assets, jadi dirujuk lewat path string biasa.
const heroImg = '/assets/blazer-white-linen.jpg';
const productImg = '/assets/shirt-white-poplin.jpg';

// Anotasi Variants diperlukan supaya [0.16, 1, 0.3, 1] terbaca sebagai tuple
// cubic-bezier, bukan number[]. Tanpa ini next build gagal — vite build tidak
// pernah menangkapnya karena esbuild hanya membuang tipe tanpa memeriksanya.
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    }
  }
};

const Navbar = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-6 md:px-12 mix-blend-difference text-white">
    <Link href="/welcome" className="text-2xl tracking-tighter" data-testid="link-logo">
      <span className="font-sans font-extrabold uppercase">SWIPE</span>
      <span className="font-serif italic tracking-normal ml-0.5 font-light">Fash</span>
    </Link>
    <Link
      href="/feed"
      className="group flex items-center gap-2 text-sm font-medium tracking-wide uppercase hover:opacity-70 transition-opacity"
      data-testid="link-nav-cta"
    >
      Start Swiping
      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
    </Link>
  </nav>
);

const HeroSection = () => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, 300]);
  const opacity = useTransform(scrollY, [0, 800], [1, 0]);

  return (
    <section className="relative min-h-[100dvh] w-full overflow-hidden flex items-center justify-center bg-background py-24">
      <motion.div 
        className="absolute inset-0 z-0"
        style={{ y, opacity }}
      >
        <div className="absolute inset-0 bg-background/35 z-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-background z-10" />
        <img
          src={heroImg}
          alt="Soft linen editorial"
          className="w-full h-full object-cover object-center scale-105 animate-in fade-in zoom-in duration-1000"
        />
      </motion.div>

      <div className="relative z-20 container mx-auto px-6 md:px-12 flex flex-col items-center text-center mt-20">
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto flex flex-col items-center"
        >
          <motion.span variants={fadeUp} className="text-xs md:text-sm tracking-[0.3em] text-muted-foreground uppercase mb-6 block font-sans">
            The New Editorial
          </motion.span>
          <motion.h1 
            variants={fadeUp}
            className="text-5xl md:text-8xl lg:text-9xl leading-[0.95] md:leading-[0.9] font-serif mb-8 text-primary"
          >
            Don't <span className="italic text-muted-foreground">shop.</span><br />
            Just <span className="italic">swipe.</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="text-lg md:text-xl text-foreground/80 max-w-xl mx-auto mb-12 font-light leading-relaxed">
            The world's most dangerous curation algorithm. High-fashion editorial meets the dopamine hit of a swipe game.
          </motion.p>
          <motion.div variants={fadeUp}>
            <Link
              href="/feed"
              className="inline-flex items-center justify-center h-16 px-10 rounded-full bg-primary text-primary-foreground font-sans text-sm tracking-[0.2em] uppercase shadow-lg shadow-primary/25 hover:scale-105 transition-transform duration-300 ease-out"
              data-testid="link-hero-cta"
            >
              Enter the Experience
            </Link>
          </motion.div>
        </motion.div>
      </div>
      
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-4 animate-pulse opacity-60 text-foreground">
        <span className="text-[10px] uppercase tracking-[0.2em] font-sans">Scroll</span>
        <div className="w-[1px] h-12 bg-primary/50" />
      </div>
    </section>
  );
};

const MechanicsSection = () => {
  return (
    <section className="py-32 bg-background relative z-30">
      <div className="container mx-auto px-6 md:px-12">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="max-w-xl mb-24"
        >
          <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-serif mb-6">
            Instinct over <span className="italic text-muted-foreground">search.</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-lg text-muted-foreground font-light">
            No endless scrolling through grids. No bloated categories. Just you, the piece, and a split-second decision.
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 lg:gap-16">
          {[
            {
              icon: <X className="w-8 h-8 text-destructive" />,
              title: "Swipe Left",
              desc: "Pass. We learn what you hate and never show it again."
            },
            {
              icon: <Heart className="w-8 h-8 text-green-500" />,
              title: "Swipe Right",
              desc: "Match. Instantly saved to your personal lookbook."
            },
            {
              icon: <Zap className="w-8 h-8 text-yellow-500" />,
              title: "1-Tap Cop",
              desc: "Secure it before it's gone. Frictionless checkout."
            }
          ].map((item, i) => (
            <motion.div 
              key={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={fadeUp}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col gap-6 group"
            >
              <div className="w-16 h-16 rounded-full border border-border flex items-center justify-center bg-card group-hover:border-primary/50 transition-colors duration-500">
                {item.icon}
              </div>
              <div>
                <h3 className="text-xl font-sans font-medium tracking-tight mb-3 uppercase">{item.title}</h3>
                <p className="text-muted-foreground font-light leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const ShowcaseSection = () => {
  return (
    <section className="py-24 bg-background relative z-30 overflow-hidden">
      <div className="container mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row items-center gap-16 lg:gap-24">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="w-full md:w-1/2 relative"
          >
            <div className="aspect-[3/4] relative overflow-hidden bg-card border border-border">
              <img 
                src={productImg} 
                alt="Luxury fashion piece" 
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
              />
              <div className="absolute top-6 right-6 flex items-center gap-2">
                <span className="px-3 py-1 bg-background/80 backdrop-blur-sm text-[10px] uppercase tracking-widest border border-border">
                  Archival
                </span>
              </div>
              <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between mix-blend-difference text-white">
                <span className="font-serif italic text-2xl">01 / The Void Jacket</span>
                <span className="font-sans font-medium tracking-widest text-sm">$850</span>
              </div>
            </div>
            
            {/* Decorative swipe hints */}
            <div className="absolute top-1/2 -left-12 -translate-y-1/2 opacity-20 flex flex-col items-center gap-2">
              <MoveLeft className="w-8 h-8" />
              <span className="text-[10px] uppercase tracking-widest rotate-[-90deg] mt-6">Pass</span>
            </div>
            <div className="absolute top-1/2 -right-12 -translate-y-1/2 opacity-20 flex flex-col items-center gap-2">
              <MoveRight className="w-8 h-8" />
              <span className="text-[10px] uppercase tracking-widest rotate-90 mt-6">Match</span>
            </div>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="w-full md:w-1/2 max-w-lg"
          >
            <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl lg:text-6xl font-serif mb-8 leading-[1.1]">
              Curated drop <span className="italic text-muted-foreground">culture.</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-lg text-muted-foreground font-light mb-8 leading-relaxed">
              We source directly from underground ateliers, avant-garde designers, and rare archives. No basics. No filler. If it's on SwipeFash, it's a statement.
            </motion.p>
            <motion.ul variants={staggerContainer} className="flex flex-col gap-4 mb-12">
              {[
                "Algorithmically personalized feed",
                "Exclusive pieces you won't find on SSENSE",
                "Seamless Apple Pay checkout"
              ].map((text, i) => (
                <motion.li variants={fadeUp} key={i} className="flex items-center gap-4 text-sm font-sans tracking-wide text-primary/80">
                  <CheckCircle2 className="w-5 h-5 opacity-50" />
                  {text}
                </motion.li>
              ))}
            </motion.ul>
            <motion.div variants={fadeUp}>
              <Link
                href="/feed"
                className="inline-flex items-center gap-4 border-b border-primary pb-2 text-sm uppercase tracking-[0.2em] hover:text-muted-foreground hover:border-muted-foreground transition-colors group"
                data-testid="link-showcase-cta"
              >
                Join the Drop
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const TextureSection = () => {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0.3, 0.8], [0, -150]);

  return (
    <section className="h-[70vh] w-full relative overflow-hidden flex items-center justify-center bg-background z-20 border-y border-border">
      <motion.div
        className="absolute inset-0 z-0"
        style={{ y }}
      >
        <div className="w-full h-[130%] bg-gradient-to-br from-secondary via-background to-accent" />
      </motion.div>
      
      <div className="relative z-10 text-center px-6 max-w-3xl">
        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="text-3xl md:text-5xl font-serif italic leading-tight"
        >
          "We don't do seasons.<br />We do obsessions."
        </motion.p>
      </div>
    </section>
  );
};

const StatsSection = () => {
  return (
    <section className="py-24 bg-card z-30 relative">
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center md:text-left divide-x-0 md:divide-x divide-border">
          {[
            { label: "Pieces Curated", value: "12k+" },
            { label: "Checkout Time", value: "2s" },
            { label: "Exclusive Brands", value: "150+" },
            { label: "Compromises", value: "0" }
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className="flex flex-col items-center md:items-start md:pl-12 first:pl-0"
            >
              <span className="text-4xl md:text-5xl lg:text-6xl font-serif text-primary mb-2">
                {stat.value}
              </span>
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-sans">
                {stat.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const CTASection = () => {
  return (
    <section className="py-32 relative bg-background overflow-hidden flex items-center justify-center min-h-[70vh]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-border/20 via-background to-background z-0" />
      
      <div className="container mx-auto px-6 relative z-10 text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="max-w-2xl mx-auto flex flex-col items-center"
        >
          <motion.div variants={fadeUp} className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mb-8">
            <Flame className="w-8 h-8 text-primary-foreground" />
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-5xl md:text-7xl font-serif mb-6 leading-[0.9]">
            Ready to <span className="italic">match?</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-lg text-muted-foreground font-light mb-12">
            The grid is dead. Long live the swipe. Join the fashion revolution today.
          </motion.p>
          <motion.div variants={fadeUp}>
            <Link
              href="/feed"
              className="inline-flex items-center justify-center h-16 px-12 rounded-full bg-primary text-primary-foreground font-sans text-sm tracking-[0.2em] uppercase shadow-lg shadow-primary/25 hover:scale-105 transition-transform duration-300 ease-out"
              data-testid="link-final-cta"
            >
              Start Swiping Now
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

const Footer = () => (
  <footer className="py-12 border-t border-border bg-background text-muted-foreground text-xs uppercase tracking-widest font-sans">
    <div className="container mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-2 text-primary">
        <span className="font-extrabold">SWIPE</span>
        <span className="font-serif italic font-light normal-case tracking-normal text-sm">Fash</span>
      </div>
      <div className="flex gap-8">
        <a href="#" className="hover:text-primary transition-colors">Instagram</a>
        <a href="#" className="hover:text-primary transition-colors">TikTok</a>
        <a href="#" className="hover:text-primary transition-colors">Twitter</a>
      </div>
      <div>
        &copy; {new Date().getFullYear()} SWIPEFASH INC.
      </div>
    </div>
  </footer>
);

export default function LandingPage() {
  return (
    <div className="bg-background text-foreground min-h-[100dvh] selection:bg-primary selection:text-primary-foreground font-sans">
      <Navbar />
      <main>
        <HeroSection />
        <MechanicsSection />
        <ShowcaseSection />
        <TextureSection />
        <StatsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
