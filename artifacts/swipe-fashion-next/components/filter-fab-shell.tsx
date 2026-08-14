"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { SlidersHorizontal } from "lucide-react";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

export function FilterFabShell({
  activeCount,
  title,
  positionClassName = "bottom-[var(--nav-clearance)] right-5",
  children,
}: {
  activeCount: number;
  title: string;
  positionClassName?: string;
  children: (close: () => void) => React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const boundsRef = useRef<HTMLDivElement>(null);
  const wasDragged = useRef(false);

  return (
    <>
      <div
        ref={boundsRef}
        className="absolute inset-0 z-30 pointer-events-none"
        aria-hidden="true"
      >
        <motion.button
          type="button"
          drag
          dragConstraints={boundsRef}
          dragMomentum={false}
          dragElastic={0.08}
          whileDrag={{ scale: 1.06 }}
          onDragStart={() => {
            wasDragged.current = true;
          }}
          onClick={() => {
            if (wasDragged.current) {
              wasDragged.current = false;
              return;
            }
            setIsOpen(true);
          }}
          data-testid="button-filter"
          aria-label={title}
          className={cn(
            "pointer-events-auto absolute h-14 pl-4 pr-5 rounded-full bg-foreground text-background shadow-xl flex items-center gap-2 cursor-grab active:cursor-grabbing touch-none",
            positionClassName,
          )}
        >
          <span className="relative">
            <SlidersHorizontal className="w-5 h-5" />
            {activeCount > 0 && (
              <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </span>
          <span className="text-sm font-bold">{title}</span>
        </motion.button>
      </div>

      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerContent>
          <DrawerHeader className="pb-2">
            <DrawerTitle className="font-sans font-bold text-xl tracking-normal text-left">
              {title}
            </DrawerTitle>
          </DrawerHeader>

          <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-8 space-y-6">
            {children(() => setIsOpen(false))}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
