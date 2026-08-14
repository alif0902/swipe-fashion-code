"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, ThumbsUp, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SEEN_KEY = "hitome:feed-coach-seen";

type Step = {
  id: string;
  dir: -1 | 0 | 1;
  icon: typeof Heart;
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
    accent: "text-primary",
    glow: "from-primary/40",
    label: "右にスワイプ",
    title: "気になったら、右へ。",
    body: "サイズとカラーを選ぶ画面がひらきます。そのまま注文まで進めます。",
  },
  {
    id: "left",
    dir: -1,
    icon: X,
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
  const [isOpen, setIsOpen] = useState<boolean | null>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    try {
      setIsOpen(!localStorage.getItem(SEEN_KEY));
    } catch {
      setIsOpen(false);
    }
  }, []);

  const close = () => {
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
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
      className="absolute inset-0 z-50 flex flex-col items-center justify-center px-8 bg-foreground/55 backdrop-blur-md"
    >
      <button
        type="button"
        onClick={close}
        className="absolute top-[calc(env(safe-area-inset-top)+1rem)] right-5 text-xs tracking-widest uppercase text-white/70 hover:text-white transition-colors"
      >
        スキップ
      </button>

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
        <div
          className={cn(
            "absolute -inset-8 rounded-full blur-2xl to-transparent",
            step.glow,
            step.dir > 0 ? "bg-gradient-to-r" : "bg-gradient-to-l",
          )}
        />

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

        <motion.div
          key={step.id}
          className="absolute inset-0 z-10 rounded-2xl overflow-hidden bg-card shadow-2xl"
          initial={{ opacity: 0, scale: 0.9 }}
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
