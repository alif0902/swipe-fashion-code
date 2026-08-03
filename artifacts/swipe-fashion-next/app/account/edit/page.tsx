import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Pencil } from "lucide-react";

import { AppLayout } from "@/components/layout";
import { PageHeader } from "@/components/page-header";
import { ProfileForm } from "@/components/profile-form";
import { getCurrentUser } from "@/lib/session";
import { getUserProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "プロフィール編集｜HITOME",
  robots: { index: false, follow: false },
};

export default async function EditProfilePage() {
  const user = await getCurrentUser();

  // Satu-satunya rute yang benar-benar tertutup. Tanpa akun tidak ada apa pun
  // di sini untuk diedit, jadi dialihkan ke マイページ yang memuat ajakan
  // mendaftar — bukan ke layar kosong.
  if (!user) redirect("/account");

  const stored = await getUserProfile(user.id);

  return (
    <AppLayout>
      <div className="min-h-full bg-background pb-28">
        <PageHeader
          icon={Pencil}
          eyebrow="EDIT"
          title="プロフィール"
          subtitle="お名前とお届け先を登録できます。"
        />

        <ProfileForm
          initial={{
            name: stored?.name ?? user.name,
            postalCode: stored?.postalCode ?? "",
            prefecture: stored?.prefecture ?? "",
            city: stored?.city ?? "",
            address: stored?.address ?? "",
            building: stored?.building ?? "",
          }}
        />
      </div>
    </AppLayout>
  );
}
