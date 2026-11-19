"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class CheckLists extends Model {
    static associate(models) {
      CheckLists.belongsTo(models.Task, {
        as: "task",
        foreignKey: "task_id",
        constraints: false,
      });
    }
  }

  CheckLists.init(
    {
      task_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: false,
      },
      todo: {
        type: DataTypes.STRING(80),
        allowNull: false,
        unique: false,
      },
    },
    {
      sequelize,
      modelName: "CheckLists",
      timestamps: true,
      createdAt: true,
      updatedAt: true,
    }
  );
  return CheckLists;
};
