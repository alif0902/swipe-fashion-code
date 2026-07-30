"use client";

import { createAuthClient } from "better-auth/react";

// Tanpa baseURL: klien memakai origin halaman itu sendiri, jadi satu berkas
// ini bekerja di localhost, di preview Vercel, dan di produksi tanpa
// konfigurasi per lingkungan.
export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession } = authClient;
