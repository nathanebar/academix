"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("TaskAssignments", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "TeamMembers",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      task_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Tasks",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      completed: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      start: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      end: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      team_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Teams",
          key: "id",
        },
        onDelete: "CASCADE",
      },
       isQueueTask: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      note_for_student: {
        type: Sequelize.STRING,
        defaultValue: null,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("NOW()"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("NOW()"),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("TaskAssignments");
  },
};
