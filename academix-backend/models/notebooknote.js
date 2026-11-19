"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class NoteBookNote extends Model {
    static associate(models) {
      NoteBookNote.belongsTo(models.NoteBookFolder, {
        foreignKey: "folder_id",
        as: "folder",
        // אם מוחקים תיקייה → הפתקים שלה נמחקים
        onDelete: "CASCADE",
      });

      NoteBookNote.belongsTo(models.User, {
        foreignKey: "created_by",
        as: "creator",
      });

      // קשר עצמי: פתק → פתק אב
      NoteBookNote.belongsTo(NoteBookNote, {
        foreignKey: "parent_note_id",
        as: "parent",
        onDelete: "CASCADE",
      });

      // פתק אב עם כל התגובות שלו
      NoteBookNote.hasMany(NoteBookNote, {
        foreignKey: "parent_note_id",
        as: "replies",
      });
    }
  }

  NoteBookNote.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      folder_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "NoteBookFolders",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      parent_note_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "NoteBookNotes",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      content: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "Users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
    },
    {
      sequelize,
      modelName: "NoteBookNote",
      tableName: "NoteBookNotes",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return NoteBookNote;
};