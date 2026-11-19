"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("AxisBatchArchives", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      axis_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Axes",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      course_batch_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "CourseBatches",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      repository_kind: {
        type: Sequelize.ENUM("operational", "assignment_bank", "archives"),
        allowNull: false,
      },
       createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.addConstraint("AxisBatchArchives", {
      fields: ["axis_id", "course_batch_id"],
      type: "unique",
      name: "unique_axis_batch",
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("AxisBatchArchives");
  },
};
