// models/TeamEvent.js
"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class TeamEventAssignment extends Model {
    /**
     * Associations
     */
    static associate(models) {
      this.belongsTo(models.TeamEvent, {
        foreignKey: "TeamEventId",
        as: "teamEvent",
      });
      this.belongsTo(models.TeamMember, {
        foreignKey: "teamMemberId",
        as: "teamMember",
      });
    }
  }

  TeamEventAssignment.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      TeamEventId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "TeamEvents",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      teamMemberId: { type: DataTypes.INTEGER, allowNull: true },

      start: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      end: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      note: { type: DataTypes.TEXT, allowNull: true }, // 👈
    },
    {
      sequelize,
      modelName: "TeamEventAssignment",
      tableName: "TeamEventAssignments",
      timestamps: true,
    }
  );

  return TeamEventAssignment;
};