'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class FeedbackQuestionAnswer extends Model {
    static associate(models) {
      FeedbackQuestionAnswer.belongsTo(models.FeedbackQuestion, {
        as: "question",
        foreignKey: "question_id",
        constraints: false,
      });
      
        FeedbackQuestionAnswer.belongsTo(models.TaskAssignment, {
        as: "taskAssignment",
        foreignKey: "task_assignment_id",
        constraints: false,
      });
   /*    FeedbackQuestionAnswer.belongsTo(models.FeedbackAnswer, {
        as: "feedbackAnswer",
        foreignKey: "feedback_answer_id",
        constraints: false,
      }); */
    }
  }
  FeedbackQuestionAnswer.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
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
      question_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "FeedbackQuestions",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      answer_text: {
        type: DataTypes.TEXT,
        allowNull: true
      },
    
    },
    {
      sequelize,
      modelName: 'FeedbackQuestionAnswer',
      tableName: 'FeedbackQuestionAnswers'
    }
  );
  return FeedbackQuestionAnswer;
};