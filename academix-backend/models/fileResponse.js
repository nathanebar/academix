"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class FileResponse extends Model {
    static associate(models) {
      FileResponse.belongsTo(models.Task, {
        as: "TaskAssignments",
        foreignKey: "task_assignments_id",
        constraints: false,
      });
    }
  }

  FileResponse.init(
    {
      task_assignments_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: false,
      },
      s3BucketName: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false,
      },
      size: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: false,
      },
      length: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        unique: false,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false,
      },
      s3Key: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false,
      },
    },
    {
      sequelize,
      modelName: "FileResponse",
      timestamps: true,
      createdAt: true,
      updatedAt: false,
    }
  );
  return FileResponse;
};
