import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, ThumbsDown, ThumbsUp, Wallet } from "lucide-react";

import { AppLayout } from "@/components/layout";
import { getTasteProfile } from "@/lib/data";
import { getSessionId } from "@/lib/session";
import { describeTaste, type Affinity } from "@/lib/taste";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Style DNA | SwipeFash",
  description: "What your swipes say about your taste.",
};

// Batang afinitas. Lebarnya proporsional dengan skor absolut, jadi selera yang
// kuat terlihat jelas dibanding yang samar.
function AffinityBar({
  item,
  tone,
}: {
  item: Affinity;
  tone: "positive" | "negative";
}) {
  const width = `${Math.round(Math.abs(item.score) * 100)}%`;

  return (
    <li className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-sm capitalize truncate">
        {item.key.toLowerCase()}
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
  const sessionId = await getSessionId();
  const profile = await getTasteProfile(sessionId);

  const summary = describeTaste(profile);
  const lovedCategories = profile.categories.filter((a) => a.score > 0);
  const avoidedCategories = profile.categories.filter((a) => a.score < 0);
  const lovedBrands = profile.brands.filter((a) => a.score > 0).slice(0, 5);
  const lovedColors = profile.colors.filter((a) => a.score > 0).slice(0, 6);

  if (profile.totalSwipes === 0) {
    return (
      <AppLayout>
        <div className="min-h-[calc(100dvh-64px)] flex flex-col items-center justify-center text-center px-8">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-5">
            <Sparkles className="w-9 h-9 text-muted-foreground" />
          </div>
          <h1 className="font-serif text-3xl mb-2">No DNA yet.</h1>
          <p className="text-muted-foreground max-w-[280px] mb-6">
            Swipe through the feed and this page fills in. Every pass counts as
            much as every like.
          </p>
          <Link
            href="/feed"
            className="h-12 px-8 rounded-full bg-primary text-primary-foreground inline-flex items-center justify-center uppercase text-sm tracking-widest font-medium hover:scale-[1.03] transition-transform"
          >
            Start swiping
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-[calc(100dvh-64px)] bg-background">
        <header className="px-6 pt-10 pb-6">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Learned from {profile.totalSwipes} swipes
            </span>
          </div>
          <h1 className="font-serif text-4xl">Style DNA</h1>
          {summary && (
            <p className="text-muted-foreground mt-1 max-w-sm">
              You gravitate toward{" "}
              <span className="text-foreground capitalize">{summary}</span>.
            </p>
          )}
        </header>

        <div className="px-6 pb-10">
          <Section title="Confidence">
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-baseline justify-between mb-3">
                <span className="font-serif text-3xl">
                  {Math.round(profile.confidence * 100)}%
                </span>
                <span className="text-xs text-muted-foreground">
                  {profile.confidence < 1
                    ? "Keep swiping to sharpen it"
                    : "Dialled in"}
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
                    <span className="text-muted-foreground">kept</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ThumbsDown className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm">
                    <span className="tabular-nums">{profile.passedCount}</span>{" "}
                    <span className="text-muted-foreground">passed</span>
                  </span>
                </div>
              </div>
            </div>
          </Section>

          {lovedCategories.length > 0 && (
            <Section title="What you reach for">
              <ul className="space-y-3">
                {lovedCategories.map((item) => (
                  <AffinityBar key={item.key} item={item} tone="positive" />
                ))}
              </ul>
            </Section>
          )}

          {avoidedCategories.length > 0 && (
            <Section title="What you scroll past">
              <ul className="space-y-3">
                {avoidedCategories.map((item) => (
                  <AffinityBar key={item.key} item={item} tone="negative" />
                ))}
              </ul>
              <p className="text-xs text-muted-foreground mt-3">
                Learned from your left swipes — these sink to the bottom of your
                feed.
              </p>
            </Section>
          )}

          {lovedBrands.length > 0 && (
            <Section title="Labels">
              <ul className="space-y-3">
                {lovedBrands.map((item) => (
                  <AffinityBar key={item.key} item={item} tone="positive" />
                ))}
              </ul>
            </Section>
          )}

          {lovedColors.length > 0 && (
            <Section title="Palette">
              <div className="flex flex-wrap gap-2">
                {lovedColors.map((item) => (
                  <span
                    key={item.key}
                    className="px-3 py-1.5 rounded-full border border-border bg-card text-sm capitalize"
                  >
                    {item.key.toLowerCase()}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {profile.priceBand && (
            <Section title="Your range">
              <div className="rounded-2xl border border-border bg-card p-5 flex items-center gap-4">
                <Wallet className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="font-serif text-2xl">
                    ${profile.priceBand.min.toFixed(0)} –{" "}
                    ${profile.priceBand.max.toFixed(0)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Typically around ${profile.priceBand.mid.toFixed(0)}. Built
                    only from pieces you kept.
                  </p>
                </div>
              </div>
            </Section>
          )}

          <Link
            href="/feed"
            className="h-12 w-full rounded-full bg-primary text-primary-foreground inline-flex items-center justify-center uppercase text-sm tracking-widest font-medium hover:scale-[1.02] transition-transform"
          >
            Keep swiping
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
