"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class FeedbackAnswer extends Model {
    static associate(models) {
      FeedbackAnswer.belongsTo(models.Feedback, {
        as: "feedback",
        foreignKey: "feedback_id",
        constraints: false,
      });

      FeedbackAnswer.belongsTo(models.TaskAssignment, {
        as: "taskAssignment",
        foreignKey: "task_assignment_id",
        constraints: false,
      });
      FeedbackAnswer.belongsTo(models.TeamMember, {
        as: "teamMember",
        foreignKey: "team_member_id",
        constraints: false,
      });

      FeedbackAnswer.hasMany(models.File, {
        as: "files",
        foreignKey: "feedback_answer_id",
        constraints: false,
      });
      FeedbackAnswer.hasMany(models.FeedbackCategorySelection, {
        as: "categorySelections",
        foreignKey: "task_assignment_id",
        constraints: false,
      });
    }
  }
  FeedbackAnswer.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      feedback_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Feedbacks",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      task_assignment_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "TaskAssignments",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      team_member_id: {
        type: DataTypes.INTEGER,
        defaultValue: null,
        references: {
          model: "TeamMembers",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      text_comment: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      summary_grade: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      selectedOptionLabel: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      leaders_only_comment: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      is_viewable: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: "FeedbackAnswer",
      tableName: "FeedbackAnswers",
      indexes: [
        { name: "feedback_answers_task_assignment_id_idx", fields: ["task_assignment_id"] },
        { name: "feedback_answers_feedback_id_idx", fields: ["feedback_id"] },
      ],
    }
  );
  return FeedbackAnswer;
};