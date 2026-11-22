'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class FeedbackCategorySelection extends Model {
    static associate(models) {
      FeedbackCategorySelection.belongsTo(models.Feedback, {
        as: "feedback",
        foreignKey: "feedback_id",
        constraints: false,
      });
      
      FeedbackCategorySelection.belongsTo(models.FeedbackCategory, {
        as: "category",
        foreignKey: "category_id",
        constraints: false,
      });
      
      FeedbackCategorySelection.belongsTo(models.TaskAssignment, {
        as: "taskAssignment",
        foreignKey: "task_assignment_id",
        constraints: false,
      });
    
    }
  }
  FeedbackCategorySelection.init(
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
      category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "FeedbackCategories",
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
     selection_type: {
        type: DataTypes.ENUM("improvement", "preservation"),
        allowNull: true
      },
    },
    {
      sequelize,
      modelName: 'FeedbackCategorySelection',
      tableName: 'FeedbackCategorySelections'
    }
  );
  return FeedbackCategorySelection;
};