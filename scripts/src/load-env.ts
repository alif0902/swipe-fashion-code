import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const ENV_FILE = path.join(
  here,
  "../../artifacts/swipe-fashion-next/.env.local",
);

try {
  process.loadEnvFile(ENV_FILE);
} catch {
}
