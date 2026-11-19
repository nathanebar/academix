"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class FormQuestion extends Model {
    static associate(models) {
      FormQuestion.belongsTo(models.Form, {
        as: "form",
        foreignKey: "form_id",
        constraints: false,
      });

      FormQuestion.hasMany(models.FormOption, {
        as: "FormOptions",
        foreignKey: "question_id",
        constraints: false,
      });
      FormQuestion.hasMany(models.File, {
        as: "files",
        foreignKey: "form_question_id",
        constraints: false,
      });
    }
  }

  FormQuestion.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
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
      question_text: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      question_type: {
        type: DataTypes.ENUM(
          "scale",
          "text",
          "description",
          "multipleQuestion", // ← anciennement "matching_pairs"
          "american",
          "fill_in_bank",
          "fill_in_open",
          "ordering_words",
          "ordering_line",
          "true_false",
          "matching_pairs", // ← anciennement "matrix_single"
          "file_upload"
        ),
        allowNull: false,
      },
      is_required: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      points: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      orderIndex: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "FormQuestion",
      tableName: "FormQuestions",
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    }
  );

  return FormQuestion;
};
