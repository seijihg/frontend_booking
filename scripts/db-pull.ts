// Introspects the live Postgres schema (Django-owned tables) into
// src/server/db/schema.ts and relations.ts.
//
// The introspection output goes to /.drizzle (gitignored) first because
// src/server/db/migrations/ is reserved for curated forward migrations
// (design 02 section 4.2); the introspection snapshot must not become a fake
// baseline migration.
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

try {
  process.loadEnvFile(".env.local");
} catch {
  // fall back to the real environment
}

// CLI flags rather than drizzle.config.ts, whose `out` points at the migrations folder.
execSync(
  `npx drizzle-kit pull --dialect postgresql --url "${process.env.DATABASE_URL ?? ""}" --out .drizzle`,
  { stdio: "inherit" }
);

// drizzle-kit cannot introspect bytea and emits an invalid `unknown(...)` call;
// replace it with a customType so the schema typechecks.
const byteaDef = `
const bytea = customType<{ data: Buffer }>({
  dataType() {
    return "bytea";
  },
});
`;
const schema = readFileSync(".drizzle/schema.ts", "utf8")
  .replace(/\bunknown\("/g, 'bytea("')
  .replace("import { pgTable, ", "import { customType, pgTable, ")
  .replace('import { sql } from "drizzle-orm"\n', (m) => m + byteaDef);
writeFileSync("src/server/db/schema.ts", schema);

// relations.ts imports "./schema"; the target location is the same directory,
// so the import stays valid. Normalise just in case.
const relations = readFileSync(".drizzle/relations.ts", "utf8").replace(
  /from "\.\.\/schema"/g,
  'from "./schema"'
);
writeFileSync("src/server/db/relations.ts", relations);
