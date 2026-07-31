import type { Metadata } from "next";
import { UserRound } from "lucide-react";

import { AppLayout } from "@/components/layout";
import { PageHeader } from "@/components/page-header";
import { AccountPanel } from "@/components/account-panel";
import { getCurrentUser, getOwnerId, isAdmin } from "@/lib/session";
import { getTasteProfile, listObsessed } from "@/lib/data";
import { getUserProfile } from "@/lib/profile";
import { hasCompleteAddress } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "マイページ｜SwipeFash",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const [user, ownerId] = await Promise.all([getCurrentUser(), getOwnerId()]);

  // Dijalankan bersamaan, bukan berurutan: tiap kueri berarti satu perjalanan
  // ke Sydney, dan halaman ini butuh tiga di antaranya.
  const [profile, obsessed, stored, admin] = await Promise.all([
    getTasteProfile(ownerId),
    listObsessed(ownerId),
    user ? getUserProfile(user.id) : Promise.resolve(null),
    isAdmin(),
  ]);

  return (
    <AppLayout>
      <div className="min-h-full bg-background pb-28">
        <PageHeader
          icon={UserRound}
          eyebrow="MY PAGE"
          title="マイページ"
          subtitle={
            user
              ? undefined
              : "登録は任意です。作らなくても、すべての機能が使えます。"
          }
        />

        <AccountPanel
          user={
            user
              ? {
                  name: stored?.name ?? user.name,
                  email: user.email,
                  image: stored?.image ?? null,
                  hasAddress: stored ? hasCompleteAddress(stored) : false,
                  isAdmin: admin,
                }
              : null
          }
          stats={{
            seen: profile.totalSwipes,
            liked: profile.likedCount,
            obsessed: obsessed.length,
          }}
        />
      </div>
    </AppLayout>
  );
}
