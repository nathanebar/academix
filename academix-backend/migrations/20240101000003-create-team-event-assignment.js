// migrations/20240101000000-create-team-event-assignment.js
"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "TeamEventAssignments",
      {
        id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
        },
        TeamEventId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: "TeamEvents",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        teamMemberId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: "TeamMembers",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "SET NULL",
        },
        start: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        end: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        note: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
      },
      {
        modelName: "TeamEventAssignment",
        tableName: "TeamEventAssignments",
        timestamps: true,
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("TeamEventAssignments");
  },
};
