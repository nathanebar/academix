'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class FormOption extends Model {
    static associate(models) {
      FormOption.belongsTo(models.FormQuestion, {
        as: "question",
        foreignKey: "question_id",
        constraints: false,
      });
    }
  }
  
  FormOption.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      question_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "FormQuestions",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      option_text: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      paireKey: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      side: {
        type: DataTypes.ENUM('left',"right","none"),
        allowNull: true,
        defaultValue: 'none'
      },
      is_correct: {
        type: DataTypes.BOOLEAN,
        defaultValue: null
      },
      orderIndex: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      points: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      createdAt: {
        field: "createdAt",
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        field: "updatedAt",
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    },
    {

      sequelize,
      modelName: 'FormOption',
      tableName: 'FormOptions',
      timestamps: true,
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    }
  );
  
  return FormOption;
};