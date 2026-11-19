'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class FeedbackQuestion extends Model {
    static associate(models) {
      FeedbackQuestion.belongsTo(models.Feedback, {
        as: "feedback",
        foreignKey: "feedback_id",
        constraints: false,
      });
       FeedbackQuestion.hasMany(models.FeedbackQuestionAnswer, {
        as: "questionAnswers",
        foreignKey: "question_id"
      });
    }
  }
  FeedbackQuestion.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
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
      question_text: {
        type: DataTypes.TEXT,
        allowNull: false
      },
    
    },
    {
      sequelize,
      modelName: 'FeedbackQuestion',
      tableName: 'FeedbackQuestions'
    }
  );
  return FeedbackQuestion;
};