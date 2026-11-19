// Crée le schéma à partir des models (les migrations historiques sont incohérentes).
// Usage : npm run db:init           -> crée les tables manquantes
//         npm run db:init -- --alter -> ajuste les tables existantes aux models
//         npm run db:init -- --force -> SUPPRIME et recrée toutes les tables
require("dotenv").config({ quiet: true });
const db = require("../models");
const triggers = require("../migrations/20251009102719-create-role-assignment-triggers");

(async () => {
  const force = process.argv.includes("--force");
  const alter = process.argv.includes("--alter");
  try {
    await db.sequelize.authenticate();
    console.log(`Connected to ${db.sequelize.config.database}@${db.sequelize.config.host}`);

    await db.sequelize.sync({ force, alter });
    console.log(`Schema synced (${Object.keys(db).length - 2} models)`);

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
