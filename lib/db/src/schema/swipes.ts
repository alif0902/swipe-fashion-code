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

export const swipeDirectionEnum = pgEnum("swipe_direction", [
  "pass",
  "like",
  "super",
]);

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
    unique("swipes_session_product_uq").on(t.sessionId, t.productId),
    index("swipes_session_idx").on(t.sessionId),
  ],
);

export type Swipe = typeof swipesTable.$inferSelect;
export type SwipeDirection = Swipe["direction"];
