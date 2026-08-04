import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { productsTable } from "./products";

/**
 * Ulasan produk.
 *
 * HUBUNGANNYA DENGAN products.rating / products.reviewCount. Kedua kolom itu
 * TIDAK dihitung ulang dari tabel ini. Keduanya adalah agregat berjalan:
 * ulasan baru menggeser rata-rata sesuai bobotnya terhadap jumlah yang sudah
 * ada.
 *
 *   rataBaru = (rataLama × jumlahLama + nilaiBaru) ÷ (jumlahLama + 1)
 *
 * Itu rumus rata-rata berjalan yang benar, dan konsekuensinya disengaja:
 * katalog menyatakan 61件 sementara tabel ini hanya menyimpan beberapa yang
 * bisa dibaca. Menghitung ulang dari tabel akan menjatuhkan angkanya ke 5 dan
 * membuang riwayat penilaian yang sudah ada.
 *
 * sessionId null = ulasan bawaan dari seed. Ulasan asli terikat ke sesi
 * penulisnya, supaya nanti dia bisa menghapus miliknya sendiri tanpa bisa
 * menyentuh milik orang lain.
 */
export const reviewsTable = pgTable(
  "reviews",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .notNull()
      .references(() => productsTable.id),
    // Null untuk ulasan bawaan. Bukan FK ke user: tamu boleh menulis, dan
    // sesi anonim tidak punya baris user.
    sessionId: text("session_id"),
    authorName: text("author_name").notNull(),
    rating: integer("rating").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    // Daftar ulasan selalu diambil per produk, jadi kolom ini yang diindeks.
    index("reviews_product_idx").on(t.productId),
    // Penjaga terakhir di lapis database. Validasi Zod sudah membatasi 1–5,
    // tapi skrip seed dan sesi psql tidak melewati Zod.
    check("reviews_rating_range", sql`${t.rating} between 1 and 5`),
  ],
);

export type Review = typeof reviewsTable.$inferSelect;
