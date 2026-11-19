"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("NoteBookFolders", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      team_course_batch_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "TeamCourseBatches",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      team_member_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {                    
          model: "TeamMembers",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      system_key: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "Users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      created_at: {                  
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {                     
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("NoteBookFolders");
  },
};