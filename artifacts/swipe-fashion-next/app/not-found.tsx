import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground flex flex-col items-center justify-center px-8 text-center">
      <p className="font-serif text-6xl mb-4">404</p>
      <h1 className="font-serif text-2xl mb-3">This piece isn&apos;t here.</h1>
      <p className="text-muted-foreground text-sm max-w-[280px] mb-8">
        The page you were looking for has moved or never existed.
      </p>
      <Button asChild className="h-12 rounded-full px-8">
        <Link href="/">Back to the feed</Link>
      </Button>
    </div>
  );
}
