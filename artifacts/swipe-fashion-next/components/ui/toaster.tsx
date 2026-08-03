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

            {/* Bilah waktu, sama seperti di overlay match.
                Notifikasi yang membawa 取り消す punya tenggat, dan tanpa
                penanda ini tenggat itu tidak terlihat — orang tidak tahu
                seberapa cepat harus memutuskan. Garisnya menempel di tepi
                bawah kartu dan menyusut habis tepat saat notifikasinya
                menutup sendiri.

                Hanya digambar kalau durasinya terbatas. Toast yang menunggu
                ditutup manual (duration 0 atau Infinity) tidak punya
                hitungan mundur untuk ditampilkan. */}
            {typeof props.duration === "number" && props.duration > 0 && (
              <>
                {/* Alur dan isian dibuat SEJAJAR, bukan bersarang. CSS opacity
                    berlipat ke bawah — isian di dalam alur ber-opacity 10%
                    akan ikut tersamar sampai nyaris tak terlihat. */}
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
      {/* Bawaan = pojok kanan bawah layar, seperti aplikasi desktop biasa.
          Itu yang benar untuk panel admin. AppLayout menimpanya karena
          aplikasi ponsel butuh notifikasi di dalam bingkai, di bagian atas. */}
      <ToastViewport
        className={cn(
          "fixed bottom-0 right-0 sm:max-w-[420px]",
          viewportClassName,
        )}
      />
    </ToastProvider>
  )
}
