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

export const reviewsTable = pgTable(
  "reviews",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .notNull()
      .references(() => productsTable.id),
    sessionId: text("session_id"),
    authorName: text("author_name").notNull(),
    rating: integer("rating").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("reviews_product_idx").on(t.productId),
    check("reviews_rating_range", sql`${t.rating} between 1 and 5`),
  ],
);

export type Review = typeof reviewsTable.$inferSelect;
