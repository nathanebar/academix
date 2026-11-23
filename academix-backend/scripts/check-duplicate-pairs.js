// Read-only check for #35: lists duplicates of the column pairs that should be unique
// (one row per entity and course batch). Changes nothing: every query runs in a READ ONLY transaction.
// Usage: npm run db:check-duplicates            (uses the same .env as the backend)
//        npm run db:check-duplicates -- --all   (prints every duplicate group, not only the first 20)
require("dotenv").config({ quiet: true });
const db = require("../models");

const SAMPLE = process.argv.includes("--all") ? null : 20;
// Rows of a group are compared on every column except these.
const IGNORED = ["id", "createdAt", "updatedAt"];

const PAIRS = [
  { table: "TaskBatchStatus", cols: ["taskId", "course_batch_id"] },
  { table: "TaskGroupBatchStatus", cols: ["taskGroupId", "course_batch_id"] },
  { table: "AxisBatchArchives", cols: ["axis_id", "course_batch_id"] },
  {
    table: "TeamCourseBatches",
    cols: ["team_id", "course_batch_id"],
    // tables that point to TeamCourseBatches.id: a clean-up must move these rows to the row it keeps
    refs: [
      { table: "NoteBookFolders", col: "team_course_batch_id" },
      { table: "TeamEvents", col: "teamCourseBatchId" },
      { table: "TeamAxisOrders", col: "team_course_batch_id", uniqueWith: "axis_id" },
    ],
  },
];

const q = (name) => `"${name}"`;

async function main() {
  await db.sequelize.authenticate();
  console.log(`Database: ${db.sequelize.config.database}@${db.sequelize.config.host}`);
  console.log(`Date: ${new Date().toISOString()}\n`);

  await db.sequelize.transaction(async (transaction) => {
    const run = async (sql, bind) => (await db.sequelize.query(sql, { transaction, bind }))[0];
    await run("SET TRANSACTION READ ONLY");
    const exists = async (table) =>
      (await run("SELECT to_regclass($1) AS t", [`public.${q(table)}`]))[0].t !== null;

    for (const { table, cols, refs } of PAIRS) {
      const [a, b] = cols.map(q);
      console.log(`=== ${table} (${cols.join(", ")})`);
      if (!(await exists(table))) {
        console.log("  table not found\n");
        continue;
      }

      const unique = await run(
        `SELECT i.relname AS name FROM pg_index x JOIN pg_class i ON i.oid = x.indexrelid
         WHERE x.indrelid = $1::regclass AND x.indisunique
           AND (SELECT array_agg(att.attname::text ORDER BY att.attname::text) FROM pg_attribute att
                WHERE att.attrelid = x.indrelid AND att.attnum = ANY(x.indkey)) = $2::text[]`,
        [`public.${q(table)}`, [...cols].sort()]
      );
      if (unique.length) console.log(`  already has a UNIQUE index on the pair: ${unique.map((u) => u.name).join(", ")}`);

      // Rows with a NULL in the pair: a unique index does not see them as duplicates, so they are counted apart.
      const groups = `
        SELECT ${a} AS a, ${b} AS b, array_agg(id ORDER BY id) AS ids, count(*)::int AS n,
               count(DISTINCT (to_jsonb(t) ${IGNORED.map((c) => `- '${c}'`).join(" ")}))::int AS variants
        FROM ${q(table)} t WHERE ${a} IS NOT NULL AND ${b} IS NOT NULL
        GROUP BY ${a}, ${b} HAVING count(*) > 1`;
      const [s] = await run(`
        SELECT (SELECT count(*)::int FROM ${q(table)}) AS total,
               (SELECT count(*)::int FROM ${q(table)} WHERE ${a} IS NULL OR ${b} IS NULL) AS with_null,
               count(*)::int AS groups, coalesce(sum(n - 1), 0)::int AS extra,
               (count(*) FILTER (WHERE variants > 1))::int AS differing
        FROM (${groups}) g`);
      console.log(`  rows: ${s.total}, rows with a NULL in the pair: ${s.with_null}`);
      console.log(`  duplicate pairs: ${s.groups}, extra rows: ${s.extra}, pairs whose rows differ: ${s.differing}`);

      if (s.groups) {
        const list = await run(`SELECT * FROM (${groups}) g ORDER BY variants DESC, n DESC, a, b ${SAMPLE ? `LIMIT ${SAMPLE}` : ""}`);
        console.log(`  ${SAMPLE && s.groups > SAMPLE ? `first ${SAMPLE} groups (--all for every group)` : "groups"}, ${cols.join(" / ")}: ids${s.differing ? " (rows that differ are listed)" : ""}`);
        for (const g of list) {
          console.log(`    ${g.a} / ${g.b}: ids ${g.ids.join(", ")}${g.variants > 1 ? `, ${g.variants} different versions` : ", identical"}`);
          if (g.variants > 1) {
            const rows = await run(
              `SELECT to_jsonb(t) - 'createdAt' AS row, t."createdAt" AS created FROM ${q(table)} t WHERE id = ANY($1::int[]) ORDER BY id`,
              [g.ids]
            );
            for (const r of rows) console.log(`      ${JSON.stringify(r.row)} created ${r.created ? new Date(r.created).toISOString() : "?"}`);
          }
        }
      }

      // References to the rows of the duplicate groups
      if (s.groups && refs) {
        console.log("  rows pointing to these duplicates:");
        const dup = `SELECT unnest(ids) AS id, ids FROM (${groups}) g`;
        for (const r of refs) {
          if (!(await exists(r.table))) {
            console.log(`    ${r.table}: table not found`);
            continue;
          }
          const [c] = await run(`
            SELECT count(*)::int AS rows,
                   count(DISTINCT d.ids)::int AS groups,
                   (SELECT count(*)::int FROM (
                      SELECT d2.ids FROM ${q(r.table)} r2 JOIN (${dup}) d2 ON r2.${q(r.col)} = d2.id
                      GROUP BY d2.ids HAVING count(DISTINCT d2.id) > 1) x) AS spread
            FROM ${q(r.table)} r JOIN (${dup}) d ON r.${q(r.col)} = d.id`);
          let line = `    ${r.table}.${r.col}: ${c.rows} rows in ${c.groups} groups; groups where they point to more than one duplicate: ${c.spread}`;
          if (r.uniqueWith) {
            const [k] = await run(`
              SELECT count(*)::int AS n FROM (
                SELECT d.ids, r.${q(r.uniqueWith)} FROM ${q(r.table)} r JOIN (${dup}) d ON r.${q(r.col)} = d.id
                GROUP BY d.ids, r.${q(r.uniqueWith)} HAVING count(DISTINCT d.id) > 1) x`);
            line += `; same ${r.uniqueWith} on two duplicates (would collide with its unique index if moved): ${k.n}`;
          }
          console.log(line);
        }
      }
      console.log("");
    }
  });
}

main()
  .catch((err) => {
    console.error("check-duplicate-pairs failed:", err.message);
    process.exitCode = 1;
  })
  .finally(() => db.sequelize.close());
