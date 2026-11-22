"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class TaskAssignmentOccurrence extends Model {
    static associate(models) {
 
      TaskAssignmentOccurrence.belongsTo(models.TaskAssignment, {
        foreignKey: "task_assignment_id",
        as: "parentAssignment",
      });
    }
  }

  TaskAssignmentOccurrence.init(
    {
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
      start: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      end: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      timestamps: true,
      modelName: "TaskAssignmentOccurrence",
      tableName: "TaskAssignmentOccurrences",
      indexes: [
        { name: "task_assignment_occurrences_task_assignment_id_idx", fields: ["task_assignment_id"] },
        { name: "task_assignment_occurrences_start_end_idx", fields: ["start", "end"] },
      ],
    }
  );

  return TaskAssignmentOccurrence;
};