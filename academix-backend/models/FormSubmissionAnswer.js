"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class FormSubmissionAnswer extends Model {
    static associate(models) {
      FormSubmissionAnswer.belongsTo(models.FormSubmission, {
        as: "formSubmission",
        foreignKey: "form_submission_id",
        constraints: false,
      });
      FormSubmissionAnswer.belongsTo(models.FormQuestion, {
        as: "formQuestion",
        foreignKey: "form_question_id",
        constraints: false,
      });
    }
  }
  FormSubmissionAnswer.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      form_submission_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "FormSubmissions",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      form_question_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "FormQuestions",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      selected_option_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "FormOptions",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      value_text: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      left_option_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      right_option_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      value_number: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      
      pointEarned: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      instructor_note: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      createdAt: {
        field: "createdAt",
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        field: "updatedAt",
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "FormSubmissionAnswer",
      tableName: "FormSubmissionAnswers",
      timestamps: true,
      indexes: [
        { name: "form_submission_answers_form_submission_id_idx", fields: ["form_submission_id"] },
        { name: "form_submission_answers_form_question_id_idx", fields: ["form_question_id"] },
      ],
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    }
  );
  return FormSubmissionAnswer;
};