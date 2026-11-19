"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class TaskAssignmentHofef extends Model {
    static associate(models) {
      TaskAssignmentHofef.belongsTo(models.TaskAssignment, {
        foreignKey: "task_assignment_id",
      });
      
      TaskAssignmentHofef.belongsTo(models.TeamMember, {
        foreignKey: "team_member_id",
        as: "TeamMember",
      });
    }
  }
  TaskAssignmentHofef.init(
    {
      task_assignment_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      team_member_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      deadline: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "TaskAssignmentHofef",  
      tableName: "TaskAssignmentHofefs",  
    }
  );
  return TaskAssignmentHofef;
};