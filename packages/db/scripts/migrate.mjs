#!/usr/bin/env node
/**
 * Aplica as migrations em ordem, com controle em schema_migrations.
 * Uso: DATABASE_URL=postgres://... pnpm --filter @khoros/db migrate
 */
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "migrations");
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL não definida");
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });
await client.connect();

await client.query(`
  create table if not exists schema_migrations (
    name text primary key,
    applied_at timestamptz not null default now()
  )
`);

const applied = new Set(
  (await client.query("select name from schema_migrations")).rows.map((r) => r.name),
);

const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();

for (const file of files) {
  if (applied.has(file)) {
    console.log(`✓ ${file} (já aplicada)`);
    continue;
  }
  const sql = await readFile(path.join(dir, file), "utf8");
  console.log(`→ aplicando ${file}...`);
  try {
    await client.query("begin");
    await client.query(sql);
    await client.query("insert into schema_migrations (name) values ($1)", [file]);
    await client.query("commit");
    console.log(`✓ ${file}`);
  } catch (err) {
    await client.query("rollback");
    console.error(`✗ ${file}: ${err.message}`);
    process.exit(1);
  }
}

await client.end();
console.log("Migrations em dia.");
