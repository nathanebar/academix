// models/TeamCourseBatch.js
"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class TeamCourseBatch extends Model {
    static associate(models) {
      TeamCourseBatch.belongsTo(models.Team, { foreignKey: "team_id" });
      TeamCourseBatch.belongsTo(models.CourseBatch, {
        foreignKey: "course_batch_id",
        as: "courseBatch",
      });
    }
  }
  TeamCourseBatch.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      team_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Teams", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      course_batch_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "CourseBatches", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      blockFromDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      blockToDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      isBlockColorEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: "is_block_color_enabled",
      },
    },
    {
      sequelize,
      modelName: "TeamCourseBatch",
      tableName: "TeamCourseBatches",
      timestamps: true,
      updatedAt: false,
      // Not unique on purpose: existing production data may contain duplicates.
      indexes: [
        { name: "team_course_batches_team_id_course_batch_id_idx", fields: ["team_id", "course_batch_id"] },
        { name: "team_course_batches_course_batch_id_idx", fields: ["course_batch_id"] },
      ],
    }
  );
  return TeamCourseBatch;
};
