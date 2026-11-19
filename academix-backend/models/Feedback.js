"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Feedback extends Model {
    static associate(models) {
      Feedback.belongsTo(models.Team, {
        as: "team",
        foreignKey: "team_id",
        constraints: false,
      });
      Feedback.belongsTo(models.Course, {
        foreignKey: "courseId",
        as: "Course",
        constraints: true,
      });
      Feedback.hasMany(models.FeedbackCategory, {
        as: "categories",
        foreignKey: "feedback_id",
        onDelete: "CASCADE",
      });
      Feedback.hasMany(models.FeedbackQuestion, {
        as: "questions",
        foreignKey: "feedback_id",
        onDelete: "CASCADE",
      });
      Feedback.hasMany(models.FeedbackAnswer, {
        as: "answers",
        foreignKey: "feedback_id",
        onDelete: "CASCADE",
      });
      Feedback.hasMany(models.FeedbackCategorySelection, {
        as: "categorySelections",
        foreignKey: "feedback_id",
        onDelete: "CASCADE",
      });
    }
  }
  Feedback.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      select_option_score: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      team_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "Teams",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      courseId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Courses",
          key: "id",
        },
      },
      categoryComment: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      created_by: {
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
      seenGrade: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: "Feedback",
      tableName: "Feedbacks",
    }
  );
  return Feedback;
};
