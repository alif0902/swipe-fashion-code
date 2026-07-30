import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth";

// Satu-satunya rute API di aplikasi ini. Sisanya memakai Server Component dan
// Server Action tanpa lapisan HTTP internal — tapi Better Auth memang perlu
// endpoint sungguhan karena klien di browser yang memanggilnya.
export const { GET, POST } = toNextJsHandler(auth);
