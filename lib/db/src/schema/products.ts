import { sql } from "drizzle-orm";
import { pgTable, serial, text, integer, numeric, boolean, timestamp, jsonb, pgEnum, check } from "drizzle-orm/pg-core";

import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Hanya dua nilai: anak-anak sengaja tidak ada di katalog ini.
// Tidak dipakai "unisex" — tiap foto produk menampilkan model tertentu, dan
// menaruh foto model perempuan di bawah filter 男性 langsung terlihat salah.
export const genderEnum = pgEnum("product_gender", ["women", "men"]);


export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  brand: text("brand").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: numeric("original_price", { precision: 10, scale: 2 }),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  images: text("images").array().notNull().default([]),
  category: text("category").notNull(),
  gender: genderEnum("gender").notNull().default("women"),
  sizes: text("sizes").array().notNull().default([]),
  colors: text("colors").array().notNull().default([]),
  // Komposisi bahan, mis. "ウール80% / カシミヤ20%". Dirender di blok 基本情報.
  material: text("material"),
  // Satu kalimat pendek tentang RASA MEMAKAINYA, bukan spesifikasinya —
  // mis. "肩に置くだけで、背筋が伸びる".
  //
  // Kolom sendiri, bukan potongan dari description: gelembung caption di kartu
  // feed hanya muat satu baris, dan sebelumnya diisi `material` karena itu
  // satu-satunya kolom yang cukup pendek. Akibatnya kartu menyapa orang dengan
  // "ウール95% / ポリウレタン5%" — akurat, tapi tidak memberi tahu apa pun soal
  // bagaimana rasanya dipakai.
  //
  // Nullable: kalau kosong, kartu jatuh kembali ke material seperti dulu.
  feel: text("feel"),
  // Ukuran detail, ditampilkan di blok 基本情報.
  //
  // Sengaja jsonb dan bukan kolom terpisah: tiap kategori punya set ukuran yang
  // berbeda. Atasan diukur 着丈/身幅/肩幅/袖丈, sedangkan bawahan diukur
  // ウエスト/股上/股下/わたり幅. Kalau dijadikan kolom, separuhnya akan selalu
  // NULL dan "肩幅 celana" akan tampil janggal.
  //
  // Urutan kunci di objek dipertahankan saat dirender, jadi urutan penulisan di
  // seed itulah urutan tampilnya.
  dimensions: jsonb("dimensions")
    .$type<Record<string, string>>()
    .notNull()
    .default({}),
  stock: integer("stock").notNull().default(0),
  rating: numeric("rating", { precision: 3, scale: 2 }),
  reviewCount: integer("review_count").notNull().default(0),
  isNew: boolean("is_new").notNull().default(false),
  isSale: boolean("is_sale").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  // Jaring pengaman terakhir untuk stok.
  //
  // createOrderAction sudah memotong stok lewat satu UPDATE atomik yang
  // syaratnya ada di WHERE, jadi seharusnya tidak ada jalan menuju angka
  // negatif. "Seharusnya" itulah alasan constraint ini ada: kalau suatu saat
  // ada jalur baru yang menulis stok dan lupa penjaganya, database yang
  // menolak — bukan pelanggannya yang menerima barang yang tidak ada.
  check("products_stock_non_negative", sql`${t.stock} >= 0`),
]);

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
