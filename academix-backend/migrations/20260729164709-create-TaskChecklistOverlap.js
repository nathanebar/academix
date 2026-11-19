"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("TaskChecklistOverlap", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT,
      },
      task_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "Tasks",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      todo: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      order_index: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("NOW()"),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("NOW()"),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("TaskChecklistOverlap");
  },
};