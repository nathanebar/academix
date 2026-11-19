"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("NoteBookNotes", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      folder_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "NoteBookFolders",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
       parent_note_id: {
        type: Sequelize.INTEGER,
        allowNull: true, 
        references: {
          model: "NoteBookNotes",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE", 
      },
      
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      content: {
        type: Sequelize.JSONB,      
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
    await queryInterface.dropTable("NoteBookNotes");
  },
};