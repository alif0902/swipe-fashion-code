import "server-only";

import { eq } from "drizzle-orm";
import { db, userTable } from "@workspace/db";

export type StoredProfile = {
  name: string;
  email: string;
  image: string | null;
  postalCode: string | null;
  prefecture: string | null;
  city: string | null;
  address: string | null;
  building: string | null;
};

export async function getUserProfile(
  userId: string,
): Promise<StoredProfile | null> {
  const [row] = await db
    .select({
      name: userTable.name,
      email: userTable.email,
      image: userTable.image,
      postalCode: userTable.postalCode,
      prefecture: userTable.prefecture,
      city: userTable.city,
      address: userTable.address,
      building: userTable.building,
    })
    .from(userTable)
    .where(eq(userTable.id, userId));

  if (!row) return null;

  return { ...row, image: normalizeImage(row.image) };
}

function normalizeImage(image: string | null): string | null {
  if (!image) return null;
  if (image.startsWith("/api/avatar/")) return null;
  return image;
}
