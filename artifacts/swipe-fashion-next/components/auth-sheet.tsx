"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";

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
  const [showPassword, setShowPassword] = useState(false);
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
      console.error("[auth]", result.error);

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

    onOpenChange(false);
    setPassword("");
    setShowPassword(false);
    router.refresh();
  };

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (!next) setShowPassword(false);
        onOpenChange(next);
      }}
    >
      <DrawerContent className="max-h-[92dvh]">
        <DrawerHeader className="pb-1 shrink-0">
          <DrawerTitle className="font-sans font-bold text-xl tracking-normal text-left">
            {isSignUp ? "アカウントを作成" : "おかえりなさい"}
          </DrawerTitle>
        </DrawerHeader>

        <form onSubmit={submit} className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
          {reason && (
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              {reason}
            </p>
          )}

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
              <div className="relative">
                <Input
                  id="auth-password"
                  data-testid="input-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  className="h-12 rounded-xl pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  data-testid="button-toggle-password"
                  aria-label={
                    showPassword ? "パスワードを隠す" : "パスワードを表示"
                  }
                  aria-pressed={showPassword}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition"
                >
                  {showPassword ? (
                    <EyeOff className="w-[18px] h-[18px]" />
                  ) : (
                    <Eye className="w-[18px] h-[18px]" />
                  )}
                </button>
              </div>

              {isSignUp && (
                <>
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
