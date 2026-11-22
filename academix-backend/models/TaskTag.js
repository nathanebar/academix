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
      // (task_id, tag_id) is already the primary key; this covers lookups by tag.
      indexes: [
        { name: 'task_tags_tag_id_idx', fields: ['tag_id'] },
      ],
    }
  );

  return TaskTags;
};