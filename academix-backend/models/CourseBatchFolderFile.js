"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class CourseBatchFolderFile extends Model {
    static associate(models) {
      CourseBatchFolderFile.belongsTo(models.CourseBatchFolder, {
        foreignKey: 'folder_id',
        as: 'folder',
      });
      CourseBatchFolderFile.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator',
      });
    }
  }

  CourseBatchFolderFile.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      folder_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'folder_id',
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      size: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      s3_key: {
        type: DataTypes.STRING(500),
        allowNull: false,
        field: 's3_key',
      },
      s3_bucket_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 's3_bucket_name',
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "CourseBatchFolderFile",
      tableName: "course_batch_folder_files",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return CourseBatchFolderFile;
};