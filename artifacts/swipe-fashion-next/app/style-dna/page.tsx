import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, ThumbsDown, ThumbsUp, Wallet } from "lucide-react";

import { AppLayout } from "@/components/layout";
import { SaveTastePrompt } from "@/components/save-taste-prompt";
import { getTasteProfile } from "@/lib/data";
import { getCurrentUser, getOwnerId } from "@/lib/session";
import { categoryLabel, formatPrice } from "@/lib/format";
import { describeTaste, type Affinity } from "@/lib/taste";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "スタイルDNA｜HITOME",
  description: "スワイプが語る、あなたの好み。",
};

// Batang afinitas. Lebarnya proporsional dengan skor absolut, jadi selera yang
// kuat terlihat jelas dibanding yang samar.
function AffinityBar({
  item,
  tone,
  label,
}: {
  item: Affinity;
  tone: "positive" | "negative";
  // Kategori dilabeli bahasa Jepang, sedangkan nama brand dibiarkan huruf
  // Latin apa adanya — itu justru yang wajar di situs fashion Jepang.
  label?: string;
}) {
  const width = `${Math.round(Math.abs(item.score) * 100)}%`;

  return (
    <li className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-sm truncate">
        {label ?? item.key}
      </span>
      <span className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <span
          className={`block h-full rounded-full ${
            tone === "positive" ? "bg-primary" : "bg-muted-foreground/40"
          }`}
          style={{ width }}
        />
      </span>
      <span className="w-10 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
        {Math.round(Math.abs(item.score) * 100)}
      </span>
    </li>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-4">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default async function StyleDnaPage() {
  const [sessionId, user] = await Promise.all([getOwnerId(), getCurrentUser()]);
  const profile = await getTasteProfile(sessionId);

  const summary = describeTaste(profile);
  const lovedCategories = profile.categories.filter((a) => a.score > 0);
  const avoidedCategories = profile.categories.filter((a) => a.score < 0);
  const lovedBrands = profile.brands.filter((a) => a.score > 0).slice(0, 5);
  const lovedColors = profile.colors.filter((a) => a.score > 0).slice(0, 6);

  if (profile.totalSwipes === 0) {
    return (
      <AppLayout>
        <div className="min-h-full flex flex-col items-center justify-center text-center px-8">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-5">
            <Sparkles className="w-9 h-9 text-muted-foreground" />
          </div>
          <h1 className="font-serif text-3xl mb-2">まだデータがありません。</h1>
          <p className="text-muted-foreground max-w-[280px] mb-6">
            フィードをスワイプすると、このページが埋まっていきます。見送った一着も、選んだ一着と同じだけ手がかりになります。
          </p>
          <Link
            href="/feed"
            className="h-12 px-8 rounded-full bg-primary text-primary-foreground inline-flex items-center justify-center uppercase text-sm tracking-widest font-medium hover:scale-[1.03] transition-transform"
          >
            スワイプを始める
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-full bg-background pb-28">
        <header className="px-6 pt-10 pb-6">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              {profile.totalSwipes}回のスワイプから
            </span>
          </div>
          <h1 className="font-serif text-4xl">スタイルDNA</h1>
          {summary && (
            <p className="text-muted-foreground mt-1 max-w-sm">
              いま惹かれているのは{" "}
              <span className="text-foreground">{summary}</span>。
            </p>
          )}

          {/* Menyatakan hubungannya secara eksplisit.
              Halaman ini dan feed memakai profil yang sama sejak awal, tapi
              tanpa kalimat ini ia terbaca sebagai visualisasi yang berdiri
              sendiri — semacam hiasan. Padahal justru inilah yang menentukan
              apa yang muncul lebih dulu di kartu. */}
          <p className="text-xs text-primary/90 mt-3 leading-relaxed">
            この結果が、フィードに出る順番を決めています。
          </p>
        </header>

        <div className="px-6 pb-10">
          <Section title="精度">
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-baseline justify-between mb-3">
                <span className="font-serif text-3xl">
                  {Math.round(profile.confidence * 100)}%
                </span>
                <span className="text-xs text-muted-foreground">
                  {profile.confidence < 1
                    ? "スワイプするほど精度が上がります"
                    : "十分に学習しました"}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${Math.round(profile.confidence * 100)}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mt-5">
                <div className="flex items-center gap-2">
                  <ThumbsUp className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm">
                    <span className="tabular-nums">{profile.likedCount}</span>{" "}
                    <span className="text-muted-foreground">選んだ</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ThumbsDown className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm">
                    <span className="tabular-nums">{profile.passedCount}</span>{" "}
                    <span className="text-muted-foreground">見送った</span>
                  </span>
                </div>
              </div>
            </div>
          </Section>

          {lovedCategories.length > 0 && (
            <Section title="よく選ぶもの">
              <ul className="space-y-3">
                {lovedCategories.map((item) => (
                  <AffinityBar
                    key={item.key}
                    item={item}
                    tone="positive"
                    label={categoryLabel(item.key)}
                  />
                ))}
              </ul>
            </Section>
          )}

          {avoidedCategories.length > 0 && (
            <Section title="見送るもの">
              <ul className="space-y-3">
                {avoidedCategories.map((item) => (
                  <AffinityBar
                    key={item.key}
                    item={item}
                    tone="negative"
                    label={categoryLabel(item.key)}
                  />
                ))}
              </ul>
              <p className="text-xs text-muted-foreground mt-3">
                左スワイプから学習しました。フィードでは後ろに回ります。
              </p>
            </Section>
          )}

          {lovedBrands.length > 0 && (
            <Section title="ブランド">
              <ul className="space-y-3">
                {lovedBrands.map((item) => (
                  <AffinityBar key={item.key} item={item} tone="positive" />
                ))}
              </ul>
            </Section>
          )}

          {lovedColors.length > 0 && (
            <Section title="色の好み">
              <div className="flex flex-wrap gap-2">
                {lovedColors.map((item) => (
                  <span
                    key={item.key}
                    className="px-3 py-1.5 rounded-full border border-border bg-card text-sm"
                  >
                    {item.key}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {profile.priceBand && (
            <Section title="価格帯">
              <div className="rounded-2xl border border-border bg-card p-5 flex items-center gap-4">
                <Wallet className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="font-serif text-2xl">
                    {formatPrice(profile.priceBand.min)} 〜{" "}
                    {formatPrice(profile.priceBand.max)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    中心はおよそ{formatPrice(profile.priceBand.mid)}。選んだ一着だけから算出しています。
                  </p>
                </div>
              </div>
            </Section>
          )}

          {/* Ambang 5 swipe: di bawah itu profilnya masih terlalu tipis untuk
              layak "disimpan", dan ajakannya akan terbaca sebagai gangguan. */}
          {!user && profile.totalSwipes >= 5 && (
            <SaveTastePrompt swipeCount={profile.totalSwipes} />
          )}

          <Link
            href="/feed"
            className="h-12 w-full rounded-full bg-primary text-primary-foreground inline-flex items-center justify-center uppercase text-sm tracking-widest font-medium hover:scale-[1.02] transition-transform"
          >
            スワイプに戻る
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
