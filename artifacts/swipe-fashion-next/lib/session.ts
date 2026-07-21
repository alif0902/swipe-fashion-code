import "server-only";

import { cookies } from "next/headers";

import { SESSION_COOKIE } from "@/lib/session-cookie";

export async function getSessionId(): Promise<string> {
  const store = await cookies();
  const value = store.get(SESSION_COOKIE)?.value;

  // Middleware menetapkan cookie ini pada request pertama. Kalau tidak ada,
  // berarti request lolos dari matcher — kembalikan string kosong supaya
  // pemanggil menampilkan keadaan kosong, bukan crash.
  return value ?? "";
}
