// Crée un utilisateur ou change son mot de passe (login local).
// Usage : npm run user:create -- <username> <password> [name] [militaryid 7 chiffres]
require("dotenv").config({ quiet: true });
const db = require("../models");
const { hashPassword } = require("../src/utils/password");

(async () => {
  const [username, password, name, militaryid] = process.argv.slice(2);
  if (!username || !password) {
    console.error("Usage: npm run user:create -- <username> <password> [name] [militaryid]");
    process.exit(1);
  }
  try {
    const hash = await hashPassword(password);
    const user = await db.User.scope("withPassword").findOne({ where: { username } });
    if (user) {
      await user.update({ password: hash, ...(name ? { name } : {}) });
      console.log(`Password updated for '${username}' (id ${user.id})`);
    } else {
      const created = await db.User.create({
        username,
        password: hash,
        name: name || username,
        militaryid: militaryid || "0000000",
      });
      console.log(`User '${username}' created (id ${created.id})`);
    }
  } catch (err) {
    console.error("create-user failed:", err.message);
    process.exitCode = 1;
  } finally {
    await db.sequelize.close();
  }
})();
