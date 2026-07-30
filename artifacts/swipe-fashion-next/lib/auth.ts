import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import {
  accountTable,
  db,
  sessionTable,
  userTable,
  verificationTable,
} from "@workspace/db";

import { claimAnonymousData } from "./claim";

// Dilempar saat modul di-import, mengikuti pola DATABASE_URL di @workspace/db:
// lebih baik build gagal dengan pesan jelas daripada deploy sukses lalu setiap
// percobaan login gagal diam-diam di produksi.
if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error(
    "BETTER_AUTH_SECRET must be set.\n" +
      "  Buat nilainya : openssl rand -base64 32\n" +
      "  Lokal         : tambahkan ke artifacts/swipe-fashion-next/.env.local\n" +
      "  Vercel        : Project Settings -> Environment Variables\n",
  );
}

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,

  // Di Vercel, URL deployment berubah tiap deploy. Kalau BETTER_AUTH_URL tidak
  // diset, pakai URL deployment saat itu; untuk login email+password ini hanya
  // dipakai membangun URL absolut, jadi aman.
  baseURL:
    process.env.BETTER_AUTH_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined),

  database: drizzleAdapter(db, {
    provider: "pg",
    // Skema repo ini memakai akhiran `Table`, sedangkan Better Auth mencari
    // nama model tanpa akhiran. Pemetaannya dilakukan di sini supaya konvensi
    // penamaan repo tidak perlu dikorbankan.
    schema: {
      user: userTable,
      session: sessionTable,
      account: accountTable,
      verification: verificationTable,
    },
  }),

  user: {
    additionalFields: {
      // input: false adalah baris paling penting di berkas ini.
      //
      // Tanpa itu, siapa pun bisa mengirim request pendaftaran buatan sendiri
      // berisi `role: "admin"` — melewati formulir sepenuhnya — dan Better
      // Auth akan menyimpannya apa adanya. Dengan ini, field tersebut dibuang
      // dari input klien dan kolomnya selalu memakai nilai bawaan `user`.
      //
      // Satu-satunya jalan menjadi admin adalah `npm run make-admin`, yang
      // menulis langsung ke database dari terminalmu.
      role: {
        type: "string",
        required: false,
        input: false,
        defaultValue: "user",
      },
    },
  },

  emailAndPassword: {
    enabled: true,
    // Verifikasi email dimatikan: mengirim email butuh layanan terpisah
    // (Resend dsb.) beserta domainnya. Untuk sekarang email berfungsi sebagai
    // identitas saja. Menyalakannya nanti cukup mengubah baris ini — tabel
    // `verification` sudah dibuat.
    requireEmailVerification: false,
    minPasswordLength: 8,
  },

  session: {
    // WAJIB, bukan optimasi opsional. Tanpa cookie cache, setiap render
    // halaman menambah satu kueri sesi ke database. Database ini di Sydney,
    // jadi itu berarti satu perjalanan lintas benua tambahan per halaman —
    // persis masalah lambat yang baru saja diperbaiki.
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },

  databaseHooks: {
    session: {
      create: {
        // Berjalan setelah sesi login dibuat — dan itu terjadi baik saat
        // mendaftar maupun saat masuk kembali. Inilah satu-satunya tempat
        // yang menangkap kedua kejadian tanpa menduplikasi kode.
        after: async (session) => {
          // Sengaja tidak dibiarkan melempar. Kegagalan memindahkan riwayat
          // swipe tidak boleh membuat login itu sendiri gagal — pengguna
          // kehilangan personalisasi, bukan kehilangan akses ke akunnya.
          try {
            await claimAnonymousData(session.userId);
          } catch (error) {
            console.error("[auth] gagal mengklaim data anonim:", error);
          }
        },
      },
    },
  },
});
