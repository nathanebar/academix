"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION delete_role_assignments_on_scope_delete()
      RETURNS TRIGGER AS $$
      BEGIN
          IF TG_TABLE_NAME = 'Courses' THEN
              DELETE FROM "RoleAssignments" WHERE "scope_type" = 'course' AND "scope_id" = OLD.id;
          ELSIF TG_TABLE_NAME = 'Domains' THEN
              DELETE FROM "RoleAssignments" WHERE "scope_type" = 'domain' AND "scope_id" = OLD.id;
          ELSIF TG_TABLE_NAME = 'Teams' THEN
              DELETE FROM "RoleAssignments" WHERE "scope_type" = 'team' AND "scope_id" = OLD.id;
          ELSIF TG_TABLE_NAME = 'TeamMembers' THEN

              -- מוחק RoleAssignments שקשורים ל-user של ה-team member שנמחק
              -- מוחק את כל ה-role assignments של המשתמש הזה שקשורים ל-team
             IF TG_OP = 'DELETE' THEN
                DELETE FROM "RoleAssignments"
                WHERE "user_id" = OLD.user_id
                AND "scope_type" = 'team'
                AND "scope_id" = OLD.team_id;

              --מוחק RoleAssigment שקשורים ליוזר במידה וה delete_reason לא NULL
             ELSIF TG_OP = 'UPDATE' THEN
                 IF NEW.delete_reason IS NOT NULL AND OLD.delete_reason IS NULL THEN
                     DELETE FROM "RoleAssignments"
                     WHERE "user_id" = NEW.user_id
                     AND "scope_type" = 'team'
                     AND "scope_id" = NEW.team_id;
                 END IF;
             END IF;
         END IF;
         RETURN OLD;
    END;
    $$ LANGUAGE plpgsql;
    `);

    await queryInterface.sequelize.query(`
      CREATE TRIGGER trigger_delete_course_role_assignments
      AFTER DELETE ON "Courses"
      FOR EACH ROW EXECUTE FUNCTION delete_role_assignments_on_scope_delete();
    `);
    await queryInterface.sequelize.query(`
      CREATE TRIGGER trigger_delete_domain_role_assignments
      AFTER DELETE ON "Domains"
      FOR EACH ROW EXECUTE FUNCTION delete_role_assignments_on_scope_delete();
    `);
    await queryInterface.sequelize.query(`
      CREATE TRIGGER trigger_delete_team_role_assignments
      AFTER DELETE ON "Teams"
      FOR EACH ROW EXECUTE FUNCTION delete_role_assignments_on_scope_delete();
    `);

    // הוסף trigger ל-TeamMembers
    await queryInterface.sequelize.query(`
      CREATE TRIGGER trigger_delete_team_member_role_assignments
      AFTER DELETE OR UPDATE ON "TeamMembers"
      FOR EACH ROW EXECUTE FUNCTION delete_role_assignments_on_scope_delete();
    `);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS trigger_delete_team_member_role_assignments ON "TeamMembers";
    `);

    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS trigger_delete_course_role_assignments ON "Courses";
    `);

    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS trigger_delete_domain_role_assignments ON "Domains";
    `);

    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS trigger_delete_team_role_assignments ON "Teams";
    `);

    await queryInterface.sequelize.query(`
      DROP FUNCTION IF EXISTS delete_role_assignments_on_scope_delete();
    `);
  },
};
