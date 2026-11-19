"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class GradeStages extends Model {
    static associate(models) {
  GradeStages.belongsTo(models.Course, {
  as: "course",
  foreignKey: "course_id",
  onDelete: "CASCADE",   // מומלץ לציין גם כאן
  onUpdate: "CASCADE",
  constraints: true,
});
  GradeStages.hasMany(models.Task, {
        as: "tasks",
        foreignKey: "gradeStageId",
        constraints: false,
      });
    }
  }

  GradeStages.init(
    {
      course_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Courses',
          key: 'id'
        },
        onDelete: 'CASCADE'  // ← חשוב!
      },
      name: {
        type: DataTypes.STRING(80),
        allowNull: false,
        unique: false,
      },
    },
    {
      sequelize,
      modelName: "GradeStages",
      tableName:"GradeStages",
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    }
  );
  return GradeStages;
};
