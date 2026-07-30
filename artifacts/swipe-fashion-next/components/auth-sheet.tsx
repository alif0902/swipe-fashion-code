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
      // Penyebab sebenarnya SELALU dicatat ke konsol. Versi sebelumnya hanya
      // menampilkan kalimat umum berbahasa Jepang, dan ketika pendaftaran
      // gagal tidak ada satu pun petunjuk soal alasannya — pesan ramah yang
      // menyembunyikan penyebab justru menyulitkan.
      console.error("[auth]", result.error);

      // Kode dicocokkan lebih dulu, lalu status, lalu teks pesannya. Kode
      // adalah kontrak paling stabil, tapi angka status untuk "email sudah
      // dipakai" berbeda antar versi Better Auth — jadi ketiganya diperiksa.
      const raw = `${result.error.code ?? ""} ${result.error.message ?? ""}`;
      const alreadyExists =
        result.error.status === 422 || /already|exists|duplicate/i.test(raw);

      setError(
        alreadyExists
          ? "このメールアドレスは既に登録されています。「ログイン」タブからお進みください"
          : isSignUp
            ? `登録できませんでした（${result.error.message ?? result.error.status ?? "unknown"}）`
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
      {/*
        max-h + isi yang bisa digulir itu wajib, bukan kosmetik. Tanpa batas
        tinggi, drawer tumbuh melewati layar dan tombol 登録 berada di bawah
        tepi — tidak bisa dijangkau sama sekali. Di ponsel keadaannya lebih
        buruk: keyboard memakan separuh layar begitu kolom disentuh.

        dvh, bukan vh: di Safari iOS, vh mengabaikan bilah alamat sehingga
        drawer tetap lebih tinggi dari ruang yang benar-benar terlihat.
      */}
      <DrawerContent className="max-h-[92dvh]">
        <DrawerHeader className="pb-1 shrink-0">
          <DrawerTitle className="font-sans font-bold text-xl tracking-normal text-left">
            {isSignUp ? "アカウントを作成" : "おかえりなさい"}
          </DrawerTitle>
        </DrawerHeader>

        {/* form membungkus area gulir DAN kaki tombol, supaya Enter di kolom
            terakhir tetap mengirim formulir meski tombolnya ada di luar area
            gulir. */}
        <form onSubmit={submit} className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
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

          <div className="space-y-4">
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

          </div>

          {isSignUp && (
            <p className="text-[11px] text-muted-foreground leading-relaxed text-center mt-4">
              これまでのスワイプ履歴は、そのままアカウントに引き継がれます。
            </p>
          )}
        </div>

        {/* Kaki yang selalu terlihat.
            Tombol kirim tidak boleh ikut tergulir: di ponsel, keyboard yang
            terbuka mendorongnya keluar layar dan formulirnya jadi buntu —
            orang mengisi semuanya lalu tidak menemukan cara mengirimnya.

            Pesan galat ikut di sini, bukan di dalam area gulir, karena galat
            yang muncul di bagian yang sedang tidak terlihat sama saja dengan
            tidak ada. */}
        <div className="shrink-0 border-t border-border bg-background px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] space-y-2.5">
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
        </div>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
