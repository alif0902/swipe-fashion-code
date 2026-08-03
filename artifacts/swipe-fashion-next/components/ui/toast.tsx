"use client"

import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      // TANPA kelas posisi sama sekali — hanya tata letak.
      //
      // Bawaan shadcn menaruh `top-0 sm:bottom-0 sm:right-0 sm:top-auto` di
      // sini. Varian `sm:` itu MENGALAHKAN override tanpa prefix dari
      // pemanggil: twMerge memperlakukan `top-…` dan `sm:top-auto` sebagai dua
      // hal berbeda, jadi keduanya bertahan dan di layar ≥640px yang menang
      // tetap `sm:`. Akibatnya notifikasi aplikasi ponsel yang sudah disuruh
      // ke atas tetap jatuh ke kanan bawah saat dibuka di browser lebar.
      //
      // Sekarang posisinya wajib datang dari pemanggil, dan tidak ada yang
      // diam-diam menimpanya.
      "z-[100] flex max-h-screen w-full flex-col p-4",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  // rounded-[1.5rem] menyamakan lengkung dengan bilah navigasi dan kartu
  // produk. shadow lebih dalam dan lebih lembut daripada shadow-lg bawaan —
  // di atas latar terang, bayangan yang mengangkat permukaan, bukan garis
  // tepi.
  "group pointer-events-auto relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-[1.5rem] border px-5 py-4 pr-10 shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full",
  {
    variants: {
      variant: {
        // --card (putih), BUKAN --background (pink lembut).
        //
        // Latar feed adalah gradasi pink-ungu, dan --background hanya berjarak
        // beberapa persen darinya — notifikasinya terbaca seperti noda di atas
        // latar, bukan permukaan yang berdiri sendiri. Bordernya pun nyaris
        // tak terlihat.
        //
        // Putih menyamakannya dengan permukaan terangkat lain di aplikasi ini:
        // panel detail produk dan kartu produk sama-sama --card. Bayangannya
        // yang mengangkat, bukan warnanya.
        default: "border-black/5 bg-card text-foreground",
        destructive:
          "destructive group border-destructive bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      // Pil membulat penuh dengan warna aksen, bukan kotak abu bergaris.
      // 取り消す adalah satu-satunya jalan membatalkan sebelum notifikasinya
      // hilang — ia harus terbaca sebagai tombol yang bisa ditekan, bukan
      // hiasan di tepi kartu.
      "inline-flex h-9 shrink-0 items-center justify-center rounded-full bg-primary/10 px-4 text-sm font-bold text-primary transition-colors hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:bg-white/15 group-[.destructive]:text-destructive-foreground group-[.destructive]:hover:bg-white/25 group-[.destructive]:focus:ring-white/40",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      // SELALU terlihat, bukan hanya saat hover.
      //
      // Sebelumnya `opacity-0 group-hover:opacity-100` — dan hover tidak pernah
      // terjadi di layar sentuh. Di ponsel tombolnya jadi tak terlihat selamanya
      // sementara pr-10 tetap menyisakan 40px untuknya: ruang terbuang untuk
      // sesuatu yang tidak pernah muncul.
      "absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-foreground/40 transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 group-[.destructive]:text-destructive-foreground/60 group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-white/40",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-bold leading-snug", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    // Nama produk, bukan pesan utama — dikecilkan dan diredupkan supaya
    // judulnya yang dibaca lebih dulu. line-clamp menahan nama panjang
    // merusak tinggi kartu.
    className={cn(
      "text-xs text-muted-foreground line-clamp-1 group-[.destructive]:text-destructive-foreground/80",
      className,
    )}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
