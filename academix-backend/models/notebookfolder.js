"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class NoteBookFolder extends Model {
    static associate(models) {
      NoteBookFolder.belongsTo(models.TeamCourseBatch, {
        foreignKey: "team_course_batch_id",
        as: "teamCourseBatch",
      });

      NoteBookFolder.belongsTo(models.User, {
        foreignKey: "created_by",
        as: "creator",
      });

      NoteBookFolder.belongsTo(models.TeamMember, {
        foreignKey: "team_member_id",
        as: "teamMember",
      });
      NoteBookFolder.hasMany(models.NoteBookNote, {
      foreignKey: "folder_id",
      as: "notes",
      onDelete: "CASCADE",  
});

    }
  }

  NoteBookFolder.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      team_course_batch_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "TeamCourseBatches",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      team_member_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {                 
          model: "TeamMembers",         
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",          
      },
      system_key: {
        type: DataTypes.STRING(255),
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
      modelName: "NoteBookFolder",
      tableName: "NoteBookFolders",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return NoteBookFolder;
};