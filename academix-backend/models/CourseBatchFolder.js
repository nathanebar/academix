"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class CourseBatchFolder extends Model {
    static associate(models) {
    }
  }

  CourseBatchFolder.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      course_batch_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'course_batch_id',
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      color: {
        type: DataTypes.STRING(50),
        defaultValue: 'gray',
      },
      repository_kind: {
        type: DataTypes.STRING(50),
        defaultValue: 'operational',
      },
      team_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      team_member_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "TeamMembers",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "CourseBatchFolder",
      tableName: "course_batch_folders",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return CourseBatchFolder;
};