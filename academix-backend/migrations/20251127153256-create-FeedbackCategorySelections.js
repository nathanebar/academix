"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("FeedbackCategorySelections", {
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
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "FeedbackCategories",
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
      selection_type: {
        type: Sequelize.ENUM("improvement", "preservation"),
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
    await queryInterface.dropTable("FeedbackCategorySelections");
  },
};