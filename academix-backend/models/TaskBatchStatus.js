const { Model, Sequelize, DataTypes } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class TaskBatchStatus extends Model {
    static associate(models) {
      TaskBatchStatus.belongsTo(models.Task, { foreignKey: "taskId" });
      TaskBatchStatus.belongsTo(models.CourseBatch, {
        foreignKey: "course_batch_id",
        as: "batch",
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
    }
  );
  
  return TaskBatchStatus;
};