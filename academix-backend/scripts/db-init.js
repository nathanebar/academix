// Crée le schéma à partir des models (les migrations historiques sont incohérentes).
// Usage : npm run db:init           -> crée les tables manquantes
//         npm run db:init -- --alter -> ajuste les tables existantes aux models
//         npm run db:init -- --force -> SUPPRIME et recrée toutes les tables
require("dotenv").config({ quiet: true });
const db = require("../models");
const triggers = require("../migrations/20251009102719-create-role-assignment-triggers");

// Earlier `--alter` runs added one duplicate UNIQUE constraint per run on columns declared
// with `unique: true` ("Users_username_key1", "_key2", ...). Drop those copies: only
// constraints named "<...>_key<N>" whose definition is identical to another UNIQUE
// constraint of the same table; the shortest name (the original) is kept.
async function removeDuplicateUniqueConstraints(sequelize) {
  const [duplicates] = await sequelize.query(`
    SELECT table_name, conname FROM (
      SELECT c.conrelid::regclass::text AS table_name, c.conname,
             row_number() OVER (PARTITION BY c.conrelid, pg_get_constraintdef(c.oid)
                                ORDER BY length(c.conname), c.conname) AS rn
      FROM pg_constraint c
      WHERE c.contype = 'u' AND c.connamespace = 'public'::regnamespace
    ) d
    WHERE rn > 1 AND conname ~ '_key[0-9]+$'`);
  for (const { table_name, conname } of duplicates) {
    try {
      await sequelize.query(`ALTER TABLE ${table_name} DROP CONSTRAINT IF EXISTS "${conname}"`);
    } catch (err) {
      console.warn(`Could not drop duplicate constraint ${conname} on ${table_name}: ${err.message}`);
    }
  }
  if (duplicates.length) console.log(`Removed ${duplicates.length} duplicate UNIQUE constraint(s)`);
}

(async () => {
  const force = process.argv.includes("--force");
  const alter = process.argv.includes("--alter");
  try {
    await db.sequelize.authenticate();
    console.log(`Connected to ${db.sequelize.config.database}@${db.sequelize.config.host}`);

    await db.sequelize.sync({ force, alter });
    console.log(`Schema synced (${Object.keys(db).length - 2} models)`);

    await removeDuplicateUniqueConstraints(db.sequelize);

    // Triggers : on réutilise la migration existante, en la rendant idempotente.
    const qi = db.sequelize.getQueryInterface();
    await triggers.down(qi, db.Sequelize);
    await triggers.up(qi, db.Sequelize);
    console.log("Role-assignment triggers installed");
  } catch (err) {
    console.error("db-init failed:", err.message);
    process.exitCode = 1;
  } finally {
    await db.sequelize.close();
  }
})();
