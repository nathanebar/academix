const { Model, Sequelize, DataTypes } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class TaskGroupBatchStatus extends Model {
    static associate(models) {

      // ON DELETE CASCADE as in the original migration (20251123120946-create-task-group-batch-status-table),
      // which is what the production database has.
              TaskGroupBatchStatus.belongsTo(models.TaskGroup, { foreignKey: "taskGroupId", onDelete: "CASCADE" });

      TaskGroupBatchStatus.belongsTo(models.CourseBatch, {
        foreignKey: "course_batch_id",
        as: "batch",
        onDelete: "CASCADE",
      });
    }
  }
  
  TaskGroupBatchStatus.init(
    {
      taskGroupId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      course_batch_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("operational", "assignment_bank", "archives"),
        defaultValue: 'operational',
        allowNull: false
      },
    
    },
     {
      sequelize,
      timestamps: true,
      modelName: "TaskGroupBatchStatus",
      tableName: "TaskGroupBatchStatus",
      // Not unique on purpose: existing production data may contain duplicates.
      indexes: [
        { name: "task_group_batch_status_task_group_id_course_batch_id_idx", fields: ["taskGroupId", "course_batch_id"] },
      ],
    //   underscored: true,
    }
  );
  
  return TaskGroupBatchStatus;
};