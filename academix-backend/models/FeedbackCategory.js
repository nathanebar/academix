"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class FeedbackCategory extends Model {
    static associate(models) {
      FeedbackCategory.belongsTo(models.Feedback, {
        as: "feedback",
        foreignKey: "feedback_id",
        constraints: false,
      });
        FeedbackCategory.hasMany(models.FeedbackCategorySelection, {
        as: "selections", 
        foreignKey: "category_id",
        constraints: false,
      });
      
  
    }
  }
  FeedbackCategory.init(
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
      category: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "FeedbackCategory",
      tableName: "FeedbackCategories",
    }
  );
  return FeedbackCategory;
};