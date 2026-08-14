import "./load-env";

import { eq } from "drizzle-orm";
import { generateRandomString, hashPassword } from "better-auth/crypto";
import { accountTable, db, userTable } from "@workspace/db";

const MIN_PASSWORD_LENGTH = 8;

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  const password = process.argv[3];
  const name = process.argv[4]?.trim() || email?.split("@")[0];

  if (!email || !password) {
    console.error(
      "Pemakaian: npm run create-admin -- email@kamu.com katasandi [nama]",
    );
    process.exit(1);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error(`Format email tidak valid: ${email}`);
    process.exit(1);
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    console.error(`Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.`);
    process.exit(1);
  }

  const [existing] = await db
    .select({ id: userTable.id, role: userTable.role })
    .from(userTable)
    .where(eq(userTable.email, email));

  if (existing) {
    console.error(`Email ${email} sudah terdaftar.`);
    console.error(
      existing.role === "admin"
        ? "Akun itu sudah admin."
        : `Jadikan admin dengan: npm run make-admin -- ${email}`,
    );
    process.exit(1);
  }

  const userId = generateRandomString(32, "a-z", "A-Z", "0-9");
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx.insert(userTable).values({
      id: userId,
      name: name!,
      email,
      emailVerified: true,
      role: "admin",
      createdAt: now,
      updatedAt: now,
    });

    await tx.insert(accountTable).values({
      id: generateRandomString(32, "a-z", "A-Z", "0-9"),
      accountId: userId,
      providerId: "credential",
      userId,
      password: await hashPassword(password),
      createdAt: now,
      updatedAt: now,
    });
  });

  console.log(`Akun admin dibuat: ${name} <${email}>`);
  console.log("Masuk lewat halaman /account pakai email dan kata sandi itu.");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
