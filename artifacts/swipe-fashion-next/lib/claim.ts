import "server-only";

import { cookies } from "next/headers";
import { and, eq, inArray } from "drizzle-orm";
import { db, ordersTable, superLikesTable, swipesTable } from "@workspace/db";

import { SESSION_COOKIE } from "./session-cookie";

export async function claimAnonymousData(userId: string): Promise<void> {
  const store = await cookies();
  const anonId = store.get(SESSION_COOKIE)?.value;

  if (!anonId || anonId === userId) return;

  await db.transaction(async (tx) => {
    await tx.delete(swipesTable).where(
      and(
        eq(swipesTable.sessionId, anonId),
        inArray(
          swipesTable.productId,
          tx
            .select({ productId: swipesTable.productId })
            .from(swipesTable)
            .where(eq(swipesTable.sessionId, userId)),
        ),
      ),
    );

    await tx.delete(superLikesTable).where(
      and(
        eq(superLikesTable.sessionId, anonId),
        inArray(
          superLikesTable.productId,
          tx
            .select({ productId: superLikesTable.productId })
            .from(superLikesTable)
            .where(eq(superLikesTable.sessionId, userId)),
        ),
      ),
    );

    await tx
      .update(swipesTable)
      .set({ sessionId: userId })
      .where(eq(swipesTable.sessionId, anonId));

    await tx
      .update(superLikesTable)
      .set({ sessionId: userId })
      .where(eq(superLikesTable.sessionId, anonId));

    await tx
      .update(ordersTable)
      .set({ sessionId: userId })
      .where(eq(ordersTable.sessionId, anonId));
  });
}
