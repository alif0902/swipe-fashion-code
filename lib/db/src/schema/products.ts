import { sql } from "drizzle-orm";
import { pgTable, serial, text, integer, numeric, boolean, timestamp, jsonb, pgEnum, check } from "drizzle-orm/pg-core";

import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

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
  material: text("material"),
  feel: text("feel"),
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
  check("products_stock_non_negative", sql`${t.stock} >= 0`),
]);

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
