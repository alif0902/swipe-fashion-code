import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  unique,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { productsTable } from "./products";

// Arah swipe. "super" sengaja dipisah dari "like" karena bobotnya di mesin
// selera jauh lebih besar — lihat lib/taste.ts di aplikasi.
export const swipeDirectionEnum = pgEnum("swipe_direction", [
  "pass",
  "like",
  "super",
]);

// Setiap keputusan swipe direkam, termasuk yang ke KIRI. Swipe kiri adalah
// sinyal negatif yang sama berharganya dengan swipe kanan: tanpa itu, profil
// selera hanya tahu apa yang disukai dan tidak pernah tahu apa yang ditolak.
export const swipesTable = pgTable(
  "swipes",
  {
    id: serial("id").primaryKey(),
    sessionId: text("session_id").notNull(),
    productId: integer("product_id")
      .notNull()
      .references(() => productsTable.id),
    direction: swipeDirectionEnum("direction").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    // Satu keputusan terakhir per produk per sesi. Kalau user meng-undo lalu
    // swipe ulang ke arah lain, baris lama di-update, bukan menumpuk ganda.
    unique("swipes_session_product_uq").on(t.sessionId, t.productId),
    // Profil selera selalu dibaca per sesi, jadi kolom ini yang di-index.
    index("swipes_session_idx").on(t.sessionId),
  ],
);

export type Swipe = typeof swipesTable.$inferSelect;
export type SwipeDirection = Swipe["direction"];
