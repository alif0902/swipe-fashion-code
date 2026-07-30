import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
} from "drizzle-orm/pg-core";

/**
 * Tabel milik Better Auth.
 *
 * Bentuk kolomnya ditentukan oleh pustaka, bukan oleh kita — Better Auth
 * membaca dan menulis lewat nama kolom ini, jadi jangan diganti nama. Yang
 * boleh kita atur hanyalah cara mengekspornya, dan itu mengikuti konvensi
 * repo ini (`xxxTable`). Pemetaan ke nama model yang dikenali pustaka
 * dilakukan di `lib/auth.ts`.
 *
 * PENTING soal penamaan: tabel `session` di bawah adalah SESI LOGIN. Itu
 * bukan hal yang sama dengan "session" yang selama ini dipakai di aplikasi —
 * yang itu hanya UUID acak di cookie untuk pengunjung anonim, dan tidak punya
 * tabel sendiri. Dua konsep berbeda dengan nama mirip; di kode aplikasi yang
 * anonim disebut `anonId` supaya tidak tertukar.
 *
 * id bertipe text, bukan serial: Better Auth membuat sendiri id-nya sebagai
 * string acak. Ini juga alasan kolom `session_id` di tabel swipes/orders bisa
 * langsung diisi user.id tanpa perubahan tipe — keduanya text.
 */

export const userTable = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),

  // URL foto profil, BUKAN fotonya sendiri — isinya jalur pendek seperti
  // "/api/avatar/xxx?v=123". Datanya ada di tabel userAvatarsTable di bawah.
  // Lihat komentar di sana untuk alasannya.
  image: text("image"),

  // Alamat pengiriman. Disimpan di sini, bukan di tabel terpisah, karena
  // ukurannya kecil dan selalu dibaca bersama profilnya. Sekali diisi, langkah
  // pengiriman saat checkout terisi otomatis.
  postalCode: text("postal_code"),
  address: text("address"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Foto profil, sengaja di tabel terpisah dari `user`.
 *
 * Alasannya bukan kerapian melainkan dua kegagalan nyata kalau digabung:
 *
 * 1. Better Auth menaruh seluruh baris `user` ke dalam cookie cache sesi.
 *    Cookie dibatasi 4 KB oleh browser — foto base64 puluhan KB akan membuat
 *    cache-nya gagal diam-diam, dan setiap render halaman kembali menembak
 *    database.
 * 2. Setiap pembacaan sesi akan ikut menyeret puluhan KB dari Sydney.
 *
 * Dengan tabel sendiri, baris ini hanya dibaca oleh rute /api/avatar yang
 * memang meminta gambarnya, dan hasilnya di-cache browser.
 *
 * Menyimpan gambar di Postgres tetap bukan praktik terbaik. Kalau nanti butuh
 * berkembang, pindahkan ke Vercel Blob — yang berubah hanya isi kolom
 * `user.image`, karena seluruh aplikasi hanya membaca URL dari sana.
 */
export const userAvatarsTable = pgTable("user_avatars", {
  userId: text("user_id")
    .primaryKey()
    .references(() => userTable.id, { onDelete: "cascade" }),
  // JPEG base64. Klien mengecilkan ke 256px sebelum mengirim, jadi sekitar
  // 15–25 KB — cukup untuk lingkaran 96px di layar retina.
  data: text("data").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sessionTable = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("session_user_idx").on(t.userId)],
);

// Menyimpan kredensial. Untuk login email+password, `password` berisi hash
// Argon2id — bukan passwordnya. Tabel ini juga yang nanti dipakai kalau login
// Google ditambahkan, tanpa perubahan skema.
export const accountTable = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("account_user_idx").on(t.userId)],
);

// Belum terpakai selama verifikasi email dimatikan, tapi tetap dibuat: Better
// Auth mengharapkan tabel ini ada, dan menyalakan verifikasi nanti jadi cukup
// mengubah konfigurasi tanpa migrasi database lagi.
export const verificationTable = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type User = typeof userTable.$inferSelect;
export type AuthSession = typeof sessionTable.$inferSelect;
