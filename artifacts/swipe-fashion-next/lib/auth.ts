import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import {
  accountTable,
  db,
  sessionTable,
  userTable,
  verificationTable,
} from "@workspace/db";

import { claimAnonymousData } from "./claim";

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error(
    "BETTER_AUTH_SECRET must be set.\n" +
      "  Buat nilainya : openssl rand -base64 32\n" +
      "  Lokal         : tambahkan ke artifacts/swipe-fashion-next/.env.local\n" +
      "  Vercel        : Project Settings -> Environment Variables\n",
  );
}

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,

  baseURL: process.env.BETTER_AUTH_URL,

  trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),

  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: userTable,
      session: sessionTable,
      account: accountTable,
      verification: verificationTable,
    },
  }),

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        input: false,
        defaultValue: "user",
      },
    },
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
  },

  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },

  databaseHooks: {
    session: {
      create: {
        after: async (session) => {
          try {
            await claimAnonymousData(session.userId);
          } catch (error) {
            console.error("[auth] gagal mengklaim data anonim:", error);
          }
        },
      },
    },
  },
});
