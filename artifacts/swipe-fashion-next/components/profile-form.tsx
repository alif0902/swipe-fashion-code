"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { updateProfileAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { PREFECTURES, profileSchema } from "@/lib/validation";

export type ProfileFormValues = {
  name: string;
  postalCode: string;
  prefecture: string;
  city: string;
  address: string;
  building: string;
};

function splitPostal(value: string): [string, string] {
  const digits = value.replace(/\D/g, "");
  return [digits.slice(0, 3), digits.slice(3, 7)];
}

export function ProfileForm({ initial }: { initial: ProfileFormValues }) {
  const router = useRouter();
  const { toast } = useToast();

  const [form, setForm] = useState(initial);
  const [postal, setPostal] = useState(() => splitPostal(initial.postalCode));
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const set = (patch: Partial<ProfileFormValues>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const setPostalPart = (index: 0 | 1, raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, index === 0 ? 3 : 4);
    setPostal((prev) => {
      const next: [string, string] = index === 0 ? [digits, prev[1]] : [prev[0], digits];
      return next;
    });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const [head, tail] = postal;
    const payload = {
      ...form,
      postalCode: head && tail ? `${head}-${tail}` : "",
    };

    const parsed = profileSchema.safeParse(payload);
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
    <form onSubmit={submit} className="px-6 pb-10 space-y-7">
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
            登録しておくと、お支払いのときに自動で入力されます。
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="postal-head" className="text-sm">
            郵便番号
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="postal-head"
              data-testid="input-postal-head"
              value={postal[0]}
              onChange={(e) => setPostalPart(0, e.target.value)}
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="755"
              className="h-12 rounded-xl w-24 text-center tabular-nums"
            />
            <span className="text-muted-foreground">-</span>
            <Input
              id="postal-tail"
              data-testid="input-postal-tail"
              value={postal[1]}
              onChange={(e) => setPostalPart(1, e.target.value)}
              inputMode="numeric"
              placeholder="0096"
              className="h-12 rounded-xl w-28 text-center tabular-nums"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="profile-prefecture" className="text-sm">
            都道府県
          </Label>
          <select
            id="profile-prefecture"
            data-testid="select-prefecture"
            value={form.prefecture}
            onChange={(e) => set({ prefecture: e.target.value })}
            className="w-full h-12 rounded-xl border border-border bg-background px-3 text-sm appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23999%22 stroke-width=%222%22><path d=%22M6 9l6 6 6-6%22/></svg>')] bg-[length:20px_20px] bg-[right_0.75rem_center] bg-no-repeat pr-10"
          >
            <option value="">選択してください</option>
            {PREFECTURES.map((prefecture) => (
              <option key={prefecture} value={prefecture}>
                {prefecture}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="profile-city" className="text-sm">
            市区町村
          </Label>
          <Input
            id="profile-city"
            data-testid="input-city"
            value={form.city}
            onChange={(e) => set({ city: e.target.value })}
            autoComplete="address-level2"
            placeholder="宇部市"
            className="h-12 rounded-xl"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="profile-address" className="text-sm">
            丁目・番地・号
          </Label>
          <Input
            id="profile-address"
            data-testid="input-address"
            value={form.address}
            onChange={(e) => set({ address: e.target.value })}
            autoComplete="address-line1"
            placeholder="開5丁目2-21-3"
            className="h-12 rounded-xl"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="profile-building" className="text-sm">
            建物名・部屋番号
            <span className="text-muted-foreground font-normal ml-1.5">
              任意
            </span>
          </Label>
          <Input
            id="profile-building"
            data-testid="input-building"
            value={form.building}
            onChange={(e) => set({ building: e.target.value })}
            autoComplete="address-line2"
            placeholder="コーポ石川 12号室"
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
