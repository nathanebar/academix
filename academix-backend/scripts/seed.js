// Données minimales : rôles, un système, un administrateur (login local).
// Usage : npm run db:seed  (ADMIN_USERNAME / ADMIN_PASSWORD dans .env, sinon admin / admin)
require("dotenv").config({ quiet: true });
const db = require("../models");
const { hashPassword } = require("../src/utils/password");

const ROLES = [
  { code: "SYSTEM-ADMIN", name_he: "מנהל מערכת", name_en: "System admin" },
  { code: "DOMAIN_MANAGER", name_he: "מנהל תחום", name_en: "Domain manager" },
  { code: "COURSE_COMMANDER", name_he: "מפקד קורס", name_en: "Course commander" },
  { code: "TEAM_COMMANDER", name_he: "מפקד צוות", name_en: "Team commander" },
  { code: "OVERLAP", name_he: "חפיפה", name_en: "Overlap" },
  { code: "STUDENT", name_he: "חניך", name_en: "Student" },
  { code: "DEVELOPER", name_he: "מפתח", name_en: "Developer" },
];

(async () => {
  const { Role, System, User, RoleAssignment } = db;
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "admin";
  try {
    for (const role of ROLES) {
      await Role.findOrCreate({ where: { code: role.code }, defaults: role });
    }
    console.log(`Roles: ${ROLES.length}`);

    const [system] = await System.findOrCreate({
      where: { name: "Academix" },
      defaults: { name: "Academix" },
    });
    console.log(`System: ${system.name} (id ${system.id})`);

    const [admin, created] = await User.findOrCreate({
      where: { username },
      defaults: {
        username,
        name: "Admin",
        militaryid: "0000000",
        password: await hashPassword(password),
      },
    });
    console.log(`Admin user '${username}' ${created ? "created" : "already exists"} (id ${admin.id})`);

    await RoleAssignment.findOrCreate({
      where: { user_id: admin.id, role_code: "SYSTEM-ADMIN", scope_type: "admin" },
      defaults: { user_id: admin.id, role_code: "SYSTEM-ADMIN", scope_type: "admin", scope_id: null },
    });
    console.log("SYSTEM-ADMIN role assigned");
  } catch (err) {
    console.error("seed failed:", err.message);
    process.exitCode = 1;
  } finally {
    await db.sequelize.close();
  }
})();
