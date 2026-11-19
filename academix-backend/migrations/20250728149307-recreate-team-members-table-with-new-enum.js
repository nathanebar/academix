"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    // await queryInterface.dropTable("TeamMembers");

    await queryInterface.createTable("TeamMembers", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      team_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Teams",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      member_role: {
        type: Sequelize.ENUM("STUDENT", "TEAM_COMMANDER", "OVERLAP"),
        allowNull: false,
      },
        course_batch_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "CourseBatches",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      delete_reason: {
        type: Sequelize.ENUM(
          "Professionally",
          "LowGrades",
          "PersonalCompulsions",
          "PlacementError"
        ),
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
    await queryInterface.dropTable("TeamMembers");
  },
};
