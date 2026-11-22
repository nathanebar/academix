'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AssignmentProgress extends Model {
    static associate(models) {
      AssignmentProgress.belongsTo(models.TaskAssignment, {
        foreignKey: 'task_assignment_id'
      });
    }
  }

  AssignmentProgress.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      task_assignment_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'TaskAssignments',
          key: 'id'
        }
      },
      progress_type: {
        type: DataTypes.ENUM('form', 'link', 'checklist',  'file', 'filesResponse'),
        allowNull: false
      },
      item_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
        status: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 100
        },
        defaultValue: 1
      },
      completed_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
     
    },
    {
      sequelize,
      modelName: 'AssignmentProgress',
      tableName: 'AssignmentProgress',
      indexes: [
        { name: 'assignment_progress_task_assignment_id_idx', fields: ['task_assignment_id'] },
      ],
    }
  );

  return AssignmentProgress;
};