import { pgTable, serial, text, integer, numeric, boolean, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";

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
  // Komposisi bahan, mis. "ウール80% / カシミヤ20%".
  material: text("material"),
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
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
