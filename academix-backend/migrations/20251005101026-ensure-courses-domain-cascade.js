// migrations/20250405120006-ensure-courses-domain-cascade.js

module.exports = {
  up: async (queryInterface, DataTypes) => {
    const tableName = "Courses";
    const constraintName = "courses_domainId_fkey";

    // 1. ננסה למחוק את הקונסטרקט הישן (אם קיים)
    try {
      await queryInterface.removeConstraint(tableName, constraintName);
      console.log(`✅ Removed existing constraint: ${constraintName}`);
    } catch (err) {
      console.log(`⚠️ Constraint ${constraintName} not found or couldn't be removed.`);
    }

    // 2. הוסף מחדש עם ON DELETE CASCADE
    await queryInterface.addConstraint(tableName, {
      fields: ["domainId"],
      type: "foreign key",
      name: constraintName,
      references: {
        table: "Domains",
        field: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE" // ← זה מה שפותר
    });

    console.log(`✅ Added constraint with ON DELETE CASCADE: ${constraintName}`);
  },

  down: async (queryInterface, DataTypes) => {
    const tableName = "Courses";
    const constraintName = "courses_domainId_fkey";

    // 1. מחק את הקונסטרקט
    try {
      await queryInterface.removeConstraint(tableName, constraintName);
      console.log(`✅ Removed constraint: ${constraintName}`);
    } catch (err) {
      console.log(`⚠️ Constraint ${constraintName} not found.`);
    }

    // 2. הוסף מחדש עם RESTRICT (לצורך חזרה לאחור)
    await queryInterface.addConstraint(tableName, {
      fields: ["domainId"],
      type: "foreign key",
      name: constraintName,
      references: {
        table: "Domains",
        field: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT"
    });

    console.log(`✅ Restored constraint with ON DELETE RESTRICT`);
  }
};