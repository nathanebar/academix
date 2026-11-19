"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class TaskChecklistOverlap extends Model {
    static associate(models) {
      TaskChecklistOverlap.belongsTo(models.Task, {
        foreignKey: "task_id",
        as: "task",
      });
    }
  }

  TaskChecklistOverlap.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      task_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Tasks",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      todo: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      order_index: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: "TaskChecklistOverlap",
      tableName: "TaskChecklistOverlap",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return TaskChecklistOverlap;
};