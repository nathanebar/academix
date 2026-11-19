"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("TaskAssignmentHofefs", {  // ✅ שם הטבלה
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      task_assignment_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "TaskAssignments",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      team_member_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "TeamMembers",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      deadline: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: "דד ליין ספציפי לחופף זה",
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
    await queryInterface.addIndex("TaskAssignmentHofefs", {  // ✅ שם הטבלה
      fields: ["task_assignment_id", "team_member_id"],
      unique: true,
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("TaskAssignmentHofefs");  // ✅ שם הטבלה
  },
};