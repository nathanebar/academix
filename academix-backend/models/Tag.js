"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Tags extends Model {
    static associate(models) {
      Tags.belongsTo(models.Course, {
        as: "course",
        foreignKey: "course_id",
        constraints: false,
      });
      Tags.belongsToMany(models.Task, {
        through: models.TaskTags,
        foreignKey: "tag_id",
        otherKey: "task_id",
        as: "tasks",
      });
    }
  }

  Tags.init(
    {
      course_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: false,
      },

      tagName: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false,
      },
    },
    {
      sequelize,
      modelName: "Tags",
      timestamps: true,
      createdAt: true,
      updatedAt: false,
    }
  );
  return Tags;
};
