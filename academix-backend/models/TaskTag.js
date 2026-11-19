// models/TaskTag.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class TaskTags extends Model {
    static associate(models) {
    }
  }
  TaskTags.init(
    {
      task_id: {
        type: DataTypes.INTEGER,
        references: { model: 'Tasks', key: 'id' },
        onDelete: 'CASCADE',
        primaryKey: true,
      },
      tag_id: {
        type: DataTypes.INTEGER,
        references: { model: 'Tags', key: 'id' },
        onDelete: 'CASCADE',
        primaryKey: true,
      },
    },
    {
      sequelize,
      modelName: 'TaskTags',
      timestamps: false,         
    }
  );

  return TaskTags;
};