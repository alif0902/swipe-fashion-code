"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { updateProfileAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { profileSchema } from "@/lib/validation";

export function ProfileForm({
  initial,
}: {
  initial: { name: string; postalCode: string; address: string };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const set = (patch: Partial<typeof form>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const parsed = profileSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setIsPending(true);
    const result = await updateProfileAction(parsed.data);
    setIsPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    toast({ title: "保存しました" });
    router.push("/account");
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="px-6 pb-10 space-y-6">
      <section className="space-y-4">
        <h2 className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          プロフィール
        </h2>

        <div className="space-y-1.5">
          <Label htmlFor="profile-name" className="text-sm">
            お名前
          </Label>
          <Input
            id="profile-name"
            data-testid="input-profile-name"
            value={form.name}
            onChange={(e) => set({ name: e.target.value })}
            autoComplete="name"
            className="h-12 rounded-xl"
          />
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            お届け先
          </h2>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            登録しておくと、お支払いのときに自動で入力されます。あとから変更もできます。
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="profile-postal" className="text-sm">
            郵便番号
          </Label>
          <Input
            id="profile-postal"
            data-testid="input-postal-code"
            value={form.postalCode}
            onChange={(e) => set({ postalCode: e.target.value })}
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="150-0001"
            className="h-12 rounded-xl"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="profile-address" className="text-sm">
            住所
          </Label>
          <Input
            id="profile-address"
            data-testid="input-address"
            value={form.address}
            onChange={(e) => set({ address: e.target.value })}
            autoComplete="street-address"
            placeholder="東京都渋谷区神宮前1-2-3 ハイツ101"
            className="h-12 rounded-xl"
          />
        </div>
      </section>

      {error && (
        <p role="alert" className="text-sm text-destructive leading-snug">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={isPending}
        data-testid="button-save-profile"
        className="w-full h-12 rounded-full font-bold text-base"
      >
        {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        保存する
      </Button>
    </form>
  );
}
