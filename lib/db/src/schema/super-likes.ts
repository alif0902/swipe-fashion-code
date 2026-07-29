import { pgTable, serial, text, integer, timestamp, unique } from "drizzle-orm/pg-core";
import { productsTable } from "./products";

// Item yang di-"Super Like" (Obsessed). Dipakai untuk koleksi prioritas
// sekaligus sinyal kuat untuk mem-boost feed ke arah gaya serupa.
export const superLikesTable = pgTable(
  "super_likes",
  {
    id: serial("id").primaryKey(),
    sessionId: text("session_id").notNull(),
    productId: integer("product_id")
      .notNull()
      .references(() => productsTable.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    // Satu produk hanya bisa di-super-like sekali per sesi.
    unique("super_likes_session_product_uq").on(t.sessionId, t.productId),
  ],
);

export type SuperLike = typeof superLikesTable.$inferSelect;
