"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Course extends Model {
    static associate(models) {
      Course.belongsTo(models.Domain, {
        foreignKey: "domainId",
        onDelete: "CASCADE",
        constraints: true,
      });
      Course.hasMany(models.CourseBatch, { foreignKey: "courseId" });
      Course.hasMany(models.Axis, { foreignKey: "courseId" });
      Course.hasMany(models.Feedback, { foreignKey: "courseId" });
      Course.hasMany(models.GradeStages, {
        foreignKey: "course_id",
        onDelete: "CASCADE",
        constraints: true,
      });
        Course.hasMany(models.Form, {
        foreignKey: "courseId",
        as: "forms",
        onDelete: "CASCADE",     
        onUpdate: "CASCADE",
        constraints: true,
      });
       Course.hasMany(models.Team, {
        foreignKey: "courseId",
        as: "teams",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
      
    }
  }
  Course.init(
    {
      domainId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Domains",
          key: "id",
        },
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    
      duration_months: DataTypes.INTEGER,
      description: DataTypes.STRING,
      location: DataTypes.STRING,
      // targets: DataTypes.STRING,
      // requirements: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Course",
    }
  );
  return Course;
};
