const { Model, Sequelize, DataTypes } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class TaskGroupBatchStatus extends Model {
    static associate(models) {

              TaskGroupBatchStatus.belongsTo(models.TaskGroup, { foreignKey: "taskGroupId" });
     
      TaskGroupBatchStatus.belongsTo(models.CourseBatch, {
        foreignKey: "course_batch_id",
        as: "batch",
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
    //   underscored: true,
    }
  );
  
  return TaskGroupBatchStatus;
};