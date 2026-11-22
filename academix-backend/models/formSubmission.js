"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class FormSubmission extends Model {
    static associate(models) {
      FormSubmission.belongsTo(models.TaskAssignment, {
        as: "taskAssignment",
        foreignKey: "task_assignment_id",
        constraints: false,
      });
      
      FormSubmission.belongsTo(models.Form, {
        as: "form",
        foreignKey: "form_id",
        constraints: false,
      });
      FormSubmission.hasMany(models.FormSubmissionAnswer, {
        as: "FormSubmissionAnswers",
        foreignKey: "form_submission_id",
        constraints: false,
      });
    }
  }
  
  FormSubmission.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
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
      form_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Forms",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      started_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      submitted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      score: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
       is_published: {
  type: DataTypes.BOOLEAN,
  allowNull: false,
  defaultValue: false,
},
    },
    {
      sequelize,
      modelName: "FormSubmission",
      tableName: "FormSubmissions",
      timestamps: true,
      indexes: [
        { name: "form_submissions_task_assignment_id_idx", fields: ["task_assignment_id"] },
        { name: "form_submissions_form_id_idx", fields: ["form_id"] },
      ],
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    }
  );
  
  return FormSubmission;
};