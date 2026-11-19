'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // ---------- יצירת הטבלה ----------
    await queryInterface.createTable('RoleAssignments', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      role_code: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'Roles',
          key: 'code',
        },
        onDelete: 'CASCADE',
      },
      scope_type: {
        type: Sequelize.ENUM('system', 'domain', 'course', 'team', 'admin'),
        allowNull: false,
        defaultValue: 'system',
      },
      scope_id: {
        type: Sequelize.INTEGER,
        allowNull: true,               // מאפשר ערך null
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    const DEFAULT_ADMIN_ROLE_CODE = 'SYSTEM-ADMIN';

    // const R_A = [
    //   {
    //     user_id: 1,
    //     role_code: DEFAULT_ADMIN_ROLE_CODE,
    //     scope_type: 'system',
    //     scope_id: scope_id,              
    //     createdAt: new Date(),
    //     updatedAt: new Date(),
    //   },
    //   {
    //     user_id: 2,
    //     role_code: DEFAULT_ADMIN_ROLE_CODE,
    //     scope_type: 'system',
    //     scope_id: 1,              
    //     createdAt: new Date(),
    //     updatedAt: new Date(),
    //   },
    //   {
    //     user_id: 3,
    //     role_code: DEFAULT_ADMIN_ROLE_CODE,
    //     scope_type: 'system',
    //     scope_id: 1,              
    //     createdAt: new Date(),
    //     updatedAt: new Date(),
    //   },
    //   {
    //     user_id: 4,
    //     role_code: DEFAULT_ADMIN_ROLE_CODE,
    //     scope_type: 'system',
    //     scope_id: 1,              
    //     createdAt: new Date(),
    //     updatedAt: new Date(),
    //   },
    // ]

    // await queryInterface.bulkInsert('RoleAssignments', R_A);
  },

  async down(queryInterface, Sequelize) {
    // מחיקת הרשומה שהוכנסה ב‑up
    await queryInterface.bulkDelete(
      'RoleAssignments',
      {
        user_id: 1,
        role_code: 'SYSTEM-ADMIN',
      },
      {}
    );

    // מחיקת הטבלה
    await queryInterface.dropTable('RoleAssignments');

    // ניקוי ENUM שנוצר אוטומטית
    await queryInterface.sequelize.query(
      "DROP TYPE IF EXISTS \"enum_RoleAssignments_scope_type\";"
    );
  },
};