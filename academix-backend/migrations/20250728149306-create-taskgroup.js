"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("TaskGroups", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      axisId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Axes",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      team_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "Teams",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      status: {
        type: Sequelize.ENUM("operational", "assignment_bank", "archives"),
        defaultValue: 'operational',
        allowNull: false
      },
       deletedAt: {  // 👈 הוספתי
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()')
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("TaskGroups");
  },
};
