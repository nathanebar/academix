// src/models/axisTemplate.js
"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
  class AxisTemplate extends Model {
    static associate(models) {
      // AxisTemplate belongsTo Axes
      AxisTemplate.belongsTo(models.Axis, {
        foreignKey: "axisId",
        as: "axis",
        onDelete: "CASCADE",
      });
    }
  }

  AxisTemplate.init(
    {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      axisId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Axes",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      files:       { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      checklist:   { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      link:        { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      gradeStage:  { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      duration:    { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      feedBack:    { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      Form:        { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      FileResponse:{ type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      SolutionFile:{ type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      color: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      tags:  { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false }, 

      // ---------- timestamps ----------
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        // אפשר להשתמש ב‑Sequelize.NOW או ב‑sequelize.literal('NOW()')
        defaultValue: Sequelize.NOW,
        // או: defaultValue: sequelize.literal('NOW()')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        // או: defaultValue: sequelize.literal('NOW()')
      },
    },
    {
      sequelize,
      modelName: "AxisTemplate",
      tableName: "AxisTemplates",
      timestamps: true, // שומר על createdAt / updatedAt
    }
  );

  return AxisTemplate;
};