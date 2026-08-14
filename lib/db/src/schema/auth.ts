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

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);

export const userTable = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),

  role: userRoleEnum("role").notNull().default("user"),

  image: text("image"),

  postalCode: text("postal_code"),
  prefecture: text("prefecture"),
  city: text("city"),
  address: text("address"),
  building: text("building"),

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

export const verificationTable = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const adminAuditLogTable = pgTable(
  "admin_audit_log",
  {
    id: serial("id").primaryKey(),
    actorId: text("actor_id").notNull(),
    actorEmail: text("actor_email").notNull(),
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
