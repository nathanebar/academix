"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Form extends Model {
    static associate(models) {
      Form.belongsTo(models.Course, {
        foreignKey: "courseId",
        as: "course",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
        constraints: true,
      });
      Form.hasMany(models.Task, {
        as: "forms",
        foreignKey: "formId",
        constraints: false,
      });
      Form.hasMany(models.FormQuestion, {
        as: "FormQuestions",
        foreignKey: "form_id",
        constraints: false,
      });
      Form.hasMany(models.Task, {
        as: "tasks", // ← "forms" → "tasks"
        foreignKey: "formId",
        onDelete: "CASCADE", // ← הוסף!
        constraints: true, // ← false → true
      });
      Form.hasMany(models.FormSubmission, {
        as: "FormSubmissions",
        foreignKey: "form_id",
        constraints: false,
      });
       Form.hasMany(models.Task, {
        as: "surveyTasks",
        foreignKey: "surveyId",
        onDelete: "CASCADE",
        constraints: false,
      });
      
    }
  }

  Form.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      courseId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Courses",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      teamId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "Teams",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      type: {
        type: DataTypes.ENUM("test", "survey"),
      },
      creator: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "Users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      show_score_per_question: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: "Form",
      tableName: "Forms",
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    }
  );

  return Form;
};
