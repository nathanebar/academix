"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class TeamAxisOrder extends Model {
    static associate(models) {
      TeamAxisOrder.belongsTo(models.TeamCourseBatch, {
        foreignKey: "team_course_batch_id",
      });
      TeamAxisOrder.belongsTo(models.Axis, {
        foreignKey: "axis_id",
      });
    }
  }
  TeamAxisOrder.init(
    {
      team_course_batch_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      axis_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      display_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: "TeamAxisOrder",
      tableName: "TeamAxisOrders",
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ["team_course_batch_id", "axis_id"],
        },
      ],
    }
  );
  return TeamAxisOrder;
};