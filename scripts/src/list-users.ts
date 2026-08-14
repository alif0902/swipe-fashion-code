import "./load-env";

import { asc } from "drizzle-orm";
import { db, userTable } from "@workspace/db";

async function main() {
  const users = await db
    .select({
      email: userTable.email,
      name: userTable.name,
      role: userTable.role,
      createdAt: userTable.createdAt,
      image: userTable.image,
      address: userTable.address,
    })
    .from(userTable)
    .orderBy(asc(userTable.createdAt));

  if (users.length === 0) {
    console.log("Belum ada akun terdaftar.");
    process.exit(0);
  }

  console.table(
    users.map((u) => ({
      email: u.email,
      nama: u.name,
      peran: u.role,
      foto: u.image ? "ada" : "-",
      alamat: u.address ? "ada" : "-",
      daftar: u.createdAt.toISOString().slice(0, 16).replace("T", " "),
    })),
  );

  console.log(`\nTotal ${users.length} akun.`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
