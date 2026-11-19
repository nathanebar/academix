"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class File extends Model {
    static associate(models) {
      File.belongsTo(models.Task, {
        as: "task",
        foreignKey: "task_id",
        constraints: false,
      });
      File.belongsTo(models.User, {
        as: "creator",
        foreignKey: "creator_id",
        constraints: false,
      });
      File.belongsTo(models.FeedbackAnswer, {
        as: "feedbackAnswer",
        foreignKey: "feedback_answer_id",
        constraints: false,
      });
      File.belongsTo(models.TaskAssignment, {
        as: "TaskAssignments",
        foreignKey: "id",
        constraints: false,
      });
      File.belongsTo(models.FormQuestion, {
        as: "formQuestion",
        foreignKey: "form_question_id",
        constraints: false,
      });
    }
  }

  File.init(
    {
      creator_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "Users",
          key: "id",
        },
      },
      task_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        unique: false,
      },
      feedback_answer_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "FeedbackAnswers",
          key: "id",
        },
      },
      task_assignment_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "TaskAssignments",
          key: "id",
        },
      },
      form_question_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "FormQuestions",
          key: "id",
        },
      },

      isFileResponse: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      s3BucketName: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false,
      },
      size: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: false,
      },
      length: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        unique: false,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false,
      },
      s3Key: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false,
      },
      isPatbass: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        unique: false,
      },
    },
    {
      sequelize,
      modelName: "File",
      timestamps: true,
      createdAt: true,
      updatedAt: false,
    }
  );
  return File;
};
