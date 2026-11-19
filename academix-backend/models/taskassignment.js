"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class TaskAssignment extends Model {
    static associate(models) {
      // TaskAssignment.belongsTo(models.User, { foreignKey: "user_id" });
      TaskAssignment.belongsTo(models.Task, { foreignKey: "task_id" });
      TaskAssignment.belongsTo(models.TeamMember, {
        foreignKey: "user_id",
        as: "TeamMember" 
      });
      TaskAssignment.belongsTo(models.Team, {
        foreignKey: "team_id",
      });
      TaskAssignment.belongsTo(models.User, {
        foreignKey: "assigned_by_user_id",
        as: "assigner",
        constraints: false,
      });
      TaskAssignment.hasMany(models.FormSubmission, {
        as: "formSubmissions",
        foreignKey: "task_assignment_id",
        constraints: false,
      });
      TaskAssignment.hasMany(models.FeedbackAnswer, {
        as: "answers",
        foreignKey: "task_assignment_id",
        constraints: false,
      });
      TaskAssignment.hasMany(models.TaskAssignmentOccurrence, {
        as: "occurrences",
        foreignKey: "task_assignment_id",
        onDelete: "CASCADE",
        hooks: true,
      });
      TaskAssignment.hasMany(models.File, {
        as: "Files",
        foreignKey: "task_assignment_id",
        onDelete: "CASCADE", 
        constraints: false,
      });

       TaskAssignment.hasMany(models.TaskAssignmentHofef, {
        foreignKey: "task_assignment_id",
        as: "expectedHofefs",
        onDelete: "CASCADE",
      });


    
    }
  }

  TaskAssignment.init(
    {
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      task_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: false,
        references: {
          model: "Tasks",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE", // ← הוסף את זה!
      },
      start: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      end: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      completed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      completed: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      team_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "Teams",
          key: "id",
        },
        onDelete: "CASCADE",
      },
       isQueueTask: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
       note_for_student: {
        type: DataTypes.STRING,
        defaultValue: null
      },
      assigned_by_user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "Users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
        deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    },
    {
      sequelize,
      modelName: "TaskAssignment",
      tableName: "TaskAssignments",
      //  paranoid: true,
    }
  );

  return TaskAssignment;
};
