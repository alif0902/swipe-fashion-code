"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  Footprints,
  LogOut,
  MapPin,
  Pencil,
  ShoppingBag,
  Sparkles,
  Star,
  ThumbsUp,
  UserPlus,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AuthSheet } from "@/components/auth-sheet";
import { AvatarUploader } from "@/components/avatar-uploader";
import { signOut } from "@/lib/auth-client";

export type AccountUser = {
  name: string;
  email: string;
  image: string | null;
  hasAddress: boolean;
};

export type AccountStats = {
  seen: number;
  liked: number;
  obsessed: number;
};

// Satu baris menu. Ikon dalam lingkaran berwarna mengikuti bahasa visual
// aplikasi rujukan: warna itulah yang membuat daftar panjang bisa dipindai,
// bukan teksnya.
function MenuRow({
  href,
  icon: Icon,
  tone,
  label,
  hint,
  highlight = false,
}: {
  href: string;
  icon: LucideIcon;
  tone: string;
  label: string;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-4 px-6 py-4 transition ${
        highlight ? "bg-primary/8" : "hover:bg-muted/50"
      }`}
    >
      <span
        className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center ${tone}`}
      >
        <Icon className="w-5 h-5" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-bold leading-tight">{label}</p>
        {hint && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {hint}
          </p>
        )}
      </div>

      <ChevronRight className="w-5 h-5 shrink-0 text-muted-foreground/60" />
    </Link>
  );
}

function StatCell({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
}) {
  return (
    <div className="flex-1 flex flex-col items-center gap-1">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-[11px]">{label}</span>
      </div>
      <span className="font-sans font-bold text-2xl tabular-nums">{value}</span>
    </div>
  );
}

export function AccountPanel({
  user,
  stats,
}: {
  user: AccountUser | null;
  stats: AccountStats;
}) {
  const router = useRouter();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const leave = async () => {
    setIsLeaving(true);
    await signOut();
    setIsLeaving(false);
    router.refresh();
  };

  // Riwayat tetap ditampilkan meski belum login — datanya memang sudah ada,
  // hanya terikat ke perangkat ini. Menyembunyikannya di balik pendaftaran
  // akan membuat aplikasi terasa kosong padahal tidak.
  const menu = (
    <div className="divide-y divide-border border-y border-border">
      <MenuRow
        href="/footprints"
        icon={Footprints}
        tone="bg-primary/12 text-primary"
        label="足あと"
        hint={
          stats.seen > 0
            ? `これまで${stats.seen}点を見ました`
            : "まだ何も見ていません"
        }
      />
      <MenuRow
        href="/likes"
        icon={ThumbsUp}
        tone="bg-rose-500/12 text-rose-500"
        label="いいね！履歴"
        hint={
          stats.liked > 0
            ? `${stats.liked}点にいいね！しました`
            : "気になる一着を右にスワイプ"
        }
      />
      <MenuRow
        href="/obsessed"
        icon={Star}
        tone="bg-violet-500/12 text-violet-500"
        label="一目惚れ"
        hint={
          stats.obsessed > 0
            ? `${stats.obsessed}点を保存中`
            : "★ で特別な一着を保存"
        }
      />
      <MenuRow
        href="/style-dna"
        icon={Sparkles}
        tone="bg-amber-500/12 text-amber-500"
        label="スタイルDNA"
        hint="スワイプから学習した好み"
      />
      <MenuRow
        href="/orders"
        icon={ShoppingBag}
        tone="bg-sky-500/12 text-sky-500"
        label="バッグ"
        hint="注文とお支払い"
      />
      {user && (
        <MenuRow
          href="/account/edit"
          icon={MapPin}
          tone="bg-emerald-500/12 text-emerald-500"
          label="お届け先"
          // Ajakan ini yang membuat orang mengisi alamat SEBELUM checkout,
          // bukan saat sedang buru-buru membayar.
          hint={
            user.hasAddress
              ? "登録済み・お支払い時に自動で入ります"
              : "登録すると、お支払いのたびに入力しなくて済みます"
          }
          highlight={!user.hasAddress}
        />
      )}
    </div>
  );

  const statRow = (
    <div className="flex items-stretch py-5">
      <StatCell icon={Footprints} label="見た" value={stats.seen} />
      <span className="w-px bg-border my-1" />
      <StatCell icon={ThumbsUp} label="いいね！" value={stats.liked} />
      <span className="w-px bg-border my-1" />
      <StatCell icon={Star} label="一目惚れ" value={stats.obsessed} />
    </div>
  );

  if (!user) {
    return (
      <>
        <div className="px-6 pt-2">
          <div className="flex items-center gap-4">
            <span className="w-20 h-20 shrink-0 rounded-full bg-muted flex items-center justify-center">
              <UserRound className="w-9 h-9 text-muted-foreground" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-sans font-bold text-lg leading-tight">
                ゲストとして利用中
              </p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                この端末のブラウザにだけ記録されています。
              </p>
            </div>
          </div>

          <Button
            onClick={() => setIsSheetOpen(true)}
            data-testid="button-open-auth"
            className="w-full h-12 rounded-full font-bold text-base mt-5"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            アカウントを作成 / ログイン
          </Button>
        </div>

        {statRow}
        {menu}

        <p className="text-[11px] text-muted-foreground leading-relaxed text-center px-8 py-6">
          登録しなくても、スワイプと一目惚れはそのまま使えます。
        </p>

        <AuthSheet
          open={isSheetOpen}
          onOpenChange={setIsSheetOpen}
          reason={
            stats.seen > 0
              ? `これまでの${stats.seen}回のスワイプは、登録後もそのまま引き継がれます。`
              : undefined
          }
        />
      </>
    );
  }

  return (
    <>
      <div className="px-6 pt-2">
        <div className="flex items-center gap-4">
          <AvatarUploader>
            <span className="relative block w-20 h-20 rounded-full overflow-hidden bg-primary/15">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name}
                  fill
                  sizes="80px"
                  className="object-cover"
                  // unoptimized: sumbernya rute API kita sendiri yang sudah
                  // mengirim JPEG 256px dengan cache abadi. Melewatkannya lagi
                  // ke optimizer Next hanya menambah kerja tanpa manfaat.
                  unoptimized
                />
              ) : (
                <span className="w-full h-full flex items-center justify-center text-primary font-bold text-2xl">
                  {user.name.trim().charAt(0).toUpperCase() || "?"}
                </span>
              )}
            </span>
          </AvatarUploader>

          <div className="min-w-0 flex-1">
            <p className="font-sans font-bold text-lg leading-tight truncate">
              {user.name}
            </p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {user.email}
            </p>

            <Link
              href="/account/edit"
              data-testid="link-edit-profile"
              className="inline-flex items-center gap-1.5 mt-2.5 h-8 px-3.5 rounded-full bg-muted text-xs font-bold transition hover:bg-muted/70"
            >
              <Pencil className="w-3 h-3" />
              プロフィールを編集
            </Link>
          </div>
        </div>
      </div>

      {statRow}
      {menu}

      <div className="px-6 py-6">
        <Button
          variant="ghost"
          onClick={leave}
          disabled={isLeaving}
          data-testid="button-signout"
          className="w-full h-12 rounded-full text-muted-foreground"
        >
          <LogOut className="w-4 h-4 mr-2" />
          ログアウト
        </Button>
      </div>
    </>
  );
}
