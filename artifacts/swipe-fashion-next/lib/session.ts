import "server-only";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, userTable } from "@workspace/db";

import { auth } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/session-cookie";

export async function getAnonId(): Promise<string> {
  const store = await cookies();

  return store.get(SESSION_COOKIE)?.value ?? "";
}

export async function getCurrentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

export async function getOwnerId(): Promise<string> {
  const user = await getCurrentUser();
  if (user) return user.id;
  return getAnonId();
}

async function readRole(userId: string): Promise<string> {
  const [row] = await db
    .select({ role: userTable.role })
    .from(userTable)
    .where(eq(userTable.id, userId));

  return row?.role ?? "user";
}

export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  return (await readRole(user.id)) === "admin";
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/account");

  if ((await readRole(user.id)) !== "admin") {
    redirect("/feed");
  }

  return user;
}
