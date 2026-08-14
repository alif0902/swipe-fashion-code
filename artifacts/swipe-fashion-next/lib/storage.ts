import "server-only";

import { put } from "@vercel/blob";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

const MAX_BYTES = 2 * 1024 * 1024;

export type StorageResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export async function putDataUrl(
  dataUrl: string,
  prefix: string,
): Promise<StorageResult> {
  const match = /^data:(image\/[a-z+]+);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) {
    return { ok: false, error: "画像を読み取れませんでした。" };
  }

  const [, mime, base64] = match;
  if (!ALLOWED.has(mime)) {
    return { ok: false, error: "対応していない画像形式です。" };
  }

  const bytes = Buffer.from(base64, "base64");
  if (bytes.byteLength > MAX_BYTES) {
    return { ok: false, error: "画像のサイズが大きすぎます。" };
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return {
      ok: false,
      error:
        "画像の保存先が未設定です。BLOB_READ_WRITE_TOKEN を .env.local に追加してください。（Vercel の Storage タブで Blob ストアを作成すると取得できます）",
    };
  }

  const extension = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";

  try {
    const blob = await put(`${prefix}/${crypto.randomUUID()}.${extension}`, bytes, {
      access: "public",
      contentType: mime,
      addRandomSuffix: false,
    });

    return { ok: true, url: blob.url };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("[storage] gagal mengunggah ke Vercel Blob:", detail);

    return {
      ok: false,
      error: `画像をアップロードできませんでした: ${detail}`,
    };
  }
}
