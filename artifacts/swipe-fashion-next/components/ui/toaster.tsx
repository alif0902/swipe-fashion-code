"use client"

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

/**
 * Letak notifikasi menentukan apakah ia terbaca sebagai bagian aplikasi.
 *
 * Bawaan shadcn memakai `fixed` yang menempel ke JENDELA browser. Di aplikasi
 * ini itu salah: tokonya hidup di dalam bingkai ponsel selebar 448px, jadi
 * notifikasinya muncul jauh di pojok layar laptop, terpisah dari aplikasinya —
 * dan di ponsel ia menempel di tepi paling atas, jauh dari tombol yang baru
 * saja ditekan.
 *
 * `viewportClassName` membuat tiap pemasangan menentukan tempatnya sendiri:
 * AppLayout menaruhnya di dalam bingkai tepat di atas bilah navigasi, panel
 * admin membiarkannya di pojok layar seperti aplikasi desktop biasa.
 */
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
          </Toast>
        )
      })}
      <ToastViewport className={cn(viewportClassName)} />
    </ToastProvider>
  )
}
