export function Splash() {
  return (
    <div
      aria-hidden="true"
      className="splash fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background pointer-events-none"
    >
      <div className="splash-mark flex flex-col items-center">
        <span className="relative w-[72px] h-[72px] mb-5">
          <span className="absolute inset-0 rounded-[18px] bg-primary/35 -rotate-12" />
          <span className="absolute inset-0 rounded-[18px] bg-primary rotate-6 flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-8 h-8 text-primary-foreground -rotate-6"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
        </span>

        <p className="font-sans font-bold text-2xl tracking-[0.25em]">
          HITOME
        </p>
        <p className="text-xs text-muted-foreground mt-1.5 tracking-wide">
          スワイプで出会う、次の一着。
        </p>
      </div>
    </div>
  );
}
