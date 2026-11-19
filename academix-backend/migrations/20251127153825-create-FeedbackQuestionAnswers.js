"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("FeedbackQuestionAnswers", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      question_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "FeedbackQuestions",
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
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      answer_text: {
        type: Sequelize.TEXT,
        allowNull: true,
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
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("FeedbackQuestionAnswers");
  },
};