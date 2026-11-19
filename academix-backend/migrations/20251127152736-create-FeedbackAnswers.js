"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("FeedbackAnswers", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      feedback_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Feedbacks",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      task_assignment_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "TaskAssignments",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      team_member_id: {
        type: Sequelize.INTEGER,
        defaultValue: null,
        references: {
          model: "TeamMembers",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      text_comment: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      leaders_only_comment: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      summary_grade: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      selectedOptionLabel: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      is_viewable: { 
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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
    await queryInterface.dropTable("FeedbackAnswers");
  },
};