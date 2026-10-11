import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { createDb } from "./index.js";

/** Apply pending migrations. Forward-only: recovery from a bad migration is restore-from-backup (see docs/OPERATIONS.md). */
export async function runMigrations(connectionString: string) {
  const handle = createDb(connectionString, { max: 1, applicationName: "tokeniq-migrate" });
  try {
    await migrate(handle.db, { migrationsFolder: fileURLToPath(new URL("../migrations", import.meta.url)) });
  } finally {
    await handle.close();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");
  await runMigrations(url);
  console.log("migrations applied");
}
