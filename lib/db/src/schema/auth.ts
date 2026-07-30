import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  pgEnum,
  serial,
  integer,
} from "drizzle-orm/pg-core";

/**
 * Peran akun.
 *
 * Hanya dua nilai, dan itu disengaja. "Admin" di perusahaan besar sebenarnya
 * puluhan pekerjaan berbeda dengan izin yang rinci — tapi di sini hanya ada
 * satu orang yang mengelola katalog. Matriks izin untuk satu orang adalah
 * kerumitan tanpa manfaat.
 *
 * Nilai bawaannya `user`, dan kolom ini TIDAK PERNAH diisi dari klien. Lihat
 * `user.additionalFields` di lib/auth.ts: `input: false` yang membuat Better
 * Auth membuang field ini kalau ada yang menyisipkannya lewat request buatan
 * sendiri. Satu-satunya cara mengubahnya adalah `npm run make-admin`.
 */
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);

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

  role: userRoleEnum("role").notNull().default("user"),

  // URL foto profil di Vercel Blob. Kolom ini hanya menyimpan alamatnya —
  // gambarnya sendiri tidak pernah masuk database. Lihat lib/storage.ts.
  image: text("image"),

  // Alamat pengiriman. Disimpan di sini, bukan di tabel terpisah, karena
  // ukurannya kecil dan selalu dibaca bersama profilnya. Sekali diisi, langkah
  // pengiriman saat checkout terisi otomatis.
  postalCode: text("postal_code"),
  address: text("address"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
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

/**
 * Catatan audit tindakan admin.
 *
 * Ditiru dari praktik perusahaan besar, dan salah satu dari sedikit praktik
 * mereka yang masuk akal di skala ini: murah dibangun, dan menjawab pertanyaan
 * "siapa yang mengubah harga ini?" yang tidak bisa dijawab oleh tabel produk.
 *
 * `actorId` tidak memakai foreign key ke `user` dengan cascade delete —
 * catatan audit harus tetap ada meski akunnya dihapus. Itu inti dari audit.
 */
export const adminAuditLogTable = pgTable(
  "admin_audit_log",
  {
    id: serial("id").primaryKey(),
    actorId: text("actor_id").notNull(),
    actorEmail: text("actor_email").notNull(),
    // mis. "product.create", "product.update", "product.archive"
    action: text("action").notNull(),
    targetId: integer("target_id"),
    summary: text("summary"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("admin_audit_created_idx").on(t.createdAt)],
);

export type User = typeof userTable.$inferSelect;
export type UserRole = User["role"];
export type AuthSession = typeof sessionTable.$inferSelect;
export type AdminAuditEntry = typeof adminAuditLogTable.$inferSelect;
