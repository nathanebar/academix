"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class CourseBatch extends Model {
    static associate(models) {
      CourseBatch.belongsTo(models.Course, {
        foreignKey: "courseId",
        onDelete: "CASCADE",
        constraints: true,
      });

      CourseBatch.hasMany(models.TeamCourseBatch, {
        foreignKey: "course_batch_id",
        as: "teams",
      });

      // CourseBatch.hasMany(models.Team, { foreignKey: 'course_batch_id' });
    }
  }
  CourseBatch.init(
    {
      courseId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Courses",
          key: "id",
        },
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      start_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "CourseBatch",
    }
  );
  return CourseBatch;
};
