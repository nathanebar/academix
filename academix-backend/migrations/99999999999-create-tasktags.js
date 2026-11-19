"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("TaskTags", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT,
      },
      task_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Tasks",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      tag_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Tags",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
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
    await queryInterface.addConstraint('TaskTags', {
        fields: ['task_id', 'tag_id'],
        type: 'unique',
        name: 'uniq_task_tag'
      });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("TaskTags");
  },
};
