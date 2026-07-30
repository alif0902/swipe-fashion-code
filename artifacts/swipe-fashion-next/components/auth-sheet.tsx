"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, signUp } from "@/lib/auth-client";
import {
  passwordStrength,
  signInSchema,
  signUpSchema,
} from "@/lib/validation";
import { cn } from "@/lib/utils";

type Mode = "signup" | "signin";

/**
 * Formulir akun dalam bentuk drawer, bukan halaman tersendiri.
 *
 * Gerbang login di aplikasi ini sengaja lunak: orang boleh swipe dulu, dan
 * ajakan mendaftar muncul di tengah alur. Memindahkan mereka ke halaman lain
 * pada saat itu memutus konteks — drawer membiarkan layar di belakangnya tetap
 * terlihat, jadi jelas bahwa mereka akan kembali ke tempat yang sama.
 *
 * `reason` menjelaskan KENAPA formulirnya muncul. Ajakan yang tidak dijelaskan
 * sebabnya terbaca sebagai penghadang; yang dijelaskan terbaca sebagai tawaran.
 */
export function AuthSheet({
  open,
  onOpenChange,
  reason,
  defaultMode = "signup",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason?: string;
  defaultMode?: Mode;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const isSignUp = mode === "signup";
  const strength = passwordStrength(password);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    // Divalidasi di klien lebih dulu supaya kesalahan ketik tidak perlu
    // menunggu perjalanan ke server. Server tetap memvalidasi ulang — ini
    // kenyamanan, bukan pengamanan.
    const parsed = isSignUp
      ? signUpSchema.safeParse({ name, email, password })
      : signInSchema.safeParse({ email, password });

    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setIsPending(true);

    const result = isSignUp
      ? await signUp.email({ name, email, password })
      : await signIn.email({ email, password });

    setIsPending(false);

    if (result.error) {
      // Pesan bawaan Better Auth berbahasa Inggris dan berorientasi teknis.
      // Diterjemahkan ke kalimat yang berguna bagi pengguna.
      //
      // Kode dicek lebih dulu, baru status: kode adalah kontrak yang stabil,
      // sedangkan angka status bisa bergeser antar versi.
      const alreadyExists =
        result.error.code === "USER_ALREADY_EXISTS" ||
        result.error.status === 422;

      setError(
        alreadyExists
          ? "このメールアドレスは既に登録されています"
          : isSignUp
            ? "登録できませんでした。時間をおいて再度お試しください"
            : "メールアドレスまたはパスワードが正しくありません",
      );
      return;
    }

    // router.refresh() wajib: halaman-halaman ini adalah Server Component yang
    // membaca sesi di server. Tanpa refresh, mereka tetap menampilkan keadaan
    // anonim meski cookie sesi sudah terpasang — termasuk riwayat swipe yang
    // baru saja dipindahkan ke akun ini.
    onOpenChange(false);
    setPassword("");
    router.refresh();
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="pb-1">
          <DrawerTitle className="font-sans font-bold text-xl tracking-normal text-left">
            {isSignUp ? "アカウントを作成" : "おかえりなさい"}
          </DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-8">
          {reason && (
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              {reason}
            </p>
          )}

          {/* Pemilih mode bergaya segmented control. Dua tombol setara, bukan
              tautan kecil di bawah formulir — pengguna yang sudah punya akun
              harus bisa menemukan jalannya dalam sekali lihat. */}
          <div className="flex gap-1 p-1 rounded-full bg-muted mb-5">
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={cn(
                "flex-1 h-9 rounded-full text-sm font-bold transition",
                isSignUp ? "bg-card shadow-sm" : "text-muted-foreground",
              )}
            >
              新規登録
            </button>
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className={cn(
                "flex-1 h-9 rounded-full text-sm font-bold transition",
                !isSignUp ? "bg-card shadow-sm" : "text-muted-foreground",
              )}
            >
              ログイン
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1.5">
                <Label htmlFor="auth-name" className="text-sm">
                  お名前
                </Label>
                <Input
                  id="auth-name"
                  data-testid="input-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  placeholder="山田 花子"
                  className="h-12 rounded-xl"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="auth-email" className="text-sm">
                メールアドレス
              </Label>
              <Input
                id="auth-email"
                data-testid="input-email"
                type="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
                className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="auth-password" className="text-sm">
                パスワード
              </Label>
              <Input
                id="auth-password"
                data-testid="input-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isSignUp ? "new-password" : "current-password"}
                className="h-12 rounded-xl"
              />

              {isSignUp && (
                <>
                  {/* Tiga ruas, bukan persentase: indikator ini kasar dan
                      sebaiknya terlihat kasar. Yang menentukan diterima atau
                      tidak tetap validasi, bukan warna bilah ini. */}
                  <div className="flex gap-1 pt-1">
                    {[1, 2, 3].map((level) => (
                      <span
                        key={level}
                        className={cn(
                          "h-1 flex-1 rounded-full transition-colors",
                          strength >= level ? "bg-primary" : "bg-muted",
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground pt-0.5">
                    8文字以上、英字と数字を含めてください
                  </p>
                </>
              )}
            </div>

            {error && (
              <p
                data-testid="text-auth-error"
                role="alert"
                className="text-sm text-destructive leading-snug"
              >
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={isPending}
              data-testid="button-auth-submit"
              className="w-full h-12 rounded-full font-bold text-base"
            >
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isSignUp ? "登録する" : "ログイン"}
            </Button>
          </form>

          {isSignUp && (
            <p className="text-[11px] text-muted-foreground leading-relaxed text-center mt-4">
              これまでのスワイプ履歴は、そのままアカウントに引き継がれます。
            </p>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
