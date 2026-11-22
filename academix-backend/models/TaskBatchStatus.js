const { Model, Sequelize, DataTypes } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class TaskBatchStatus extends Model {
    static associate(models) {
      // ON DELETE CASCADE as in the original migration (20251123181148-create-Task-batch-status),
      // which is what the production database has.
      TaskBatchStatus.belongsTo(models.Task, { foreignKey: "taskId", onDelete: "CASCADE" });
      TaskBatchStatus.belongsTo(models.CourseBatch, {
        foreignKey: "course_batch_id",
        as: "batch",
        onDelete: "CASCADE",
      });
    }
  }
  
  TaskBatchStatus.init(
    {
      taskId: {
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
      modelName: "TaskBatchStatus",
      tableName: "TaskBatchStatus",
      // Not unique on purpose: existing production data may contain duplicates.
      indexes: [
        { name: "task_batch_status_task_id_course_batch_id_idx", fields: ["taskId", "course_batch_id"] },
      ],
    }
  );
  
  return TaskBatchStatus;
};