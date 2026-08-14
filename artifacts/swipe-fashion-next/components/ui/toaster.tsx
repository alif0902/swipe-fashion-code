"use client"

import { motion } from "framer-motion"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export function Toaster({
  viewportClassName,
}: {
  viewportClassName?: string
}) {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />

            {typeof props.duration === "number" && props.duration > 0 && (
              <>
                <span className="pointer-events-none absolute bottom-0 left-0 right-0 h-0.5 bg-current opacity-10" />
                <motion.span
                  className="pointer-events-none absolute bottom-0 left-0 h-0.5 bg-current opacity-40"
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{
                    duration: props.duration / 1000,
                    ease: "linear",
                  }}
                />
              </>
            )}
          </Toast>
        )
      })}
      <ToastViewport
        className={cn(
          "fixed bottom-0 right-0 sm:max-w-[420px]",
          viewportClassName,
        )}
      />
    </ToastProvider>
  )
}
