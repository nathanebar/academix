"use strict";
const { Model } = require("sequelize");
const { sequelize } = require("../models/index");
module.exports = (sequelize, DataTypes) => {
  class TaskGroup extends Model {
    static associate(models) {
      TaskGroup.hasMany(models.Task, { foreignKey: "taskGroupId" });
      TaskGroup.belongsTo(models.Axis, { foreignKey: "axisId" });
      TaskGroup.belongsTo(models.Team, {
        foreignKey: "team_id",
        allowNull: true,
      });
       TaskGroup.hasMany(models.TaskGroupBatchStatus, { foreignKey: "taskGroupId" });
    }
  }
  TaskGroup.init(
    {
      axisId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Axes",
          key: "id",
        },
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      team_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("operational", "assignment_bank", "archives"),
        defaultValue: "operational",
        allowNull: false,
      },
       deletedAt: {  // 👈 הוספתי
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      sequelize,
      modelName: "TaskGroup",
       paranoid: true, 
    }
  );

  TaskGroup.addHook("beforeUpdate", async (tg, options) => {
    if (
      !tg.changed("status") ||
      tg.dataValues.status === "archives" ||
      (tg.dataValues.status === "assignment_bank" &&
        tg._previousDataValues.status === "operational")
    )
      return;
    if (options.bypassBefore) return;

    const { Axis, AxisBatchArchives } = sequelize.models;

    if (!Axis || !AxisBatchArchives) {
      logger.error('Models not loaded correctly - Axis/AxisBatchArchives', {
        module: 'taskgroup',
        originalError: 'Models not found'
      });
      return;
    }

    const axe = await Axis.findByPk(tg.axisId);

    if (axe.repository_kind === "operational") return;

    return sequelize.transaction(async (t) => {
      await Axis.update(
        { repository_kind: tg.status },
        {
          where: { id: tg.axisId },
          bypassHook: true,
          transaction: t,
          individualHooks: true,
        }
      );

      await AxisBatchArchives.update(
        { repository_kind: tg.status },
        { where: { axis_id: tg.axisId, course_batch_id: options.batchId } }
      );
    });
  });

  TaskGroup.addHook("afterUpdate", async (tg, options) => {
    if (!tg.changed("status")) return;
    if (options.bypassHook) return;

    const { Task, TaskBatchStatus } = sequelize.models;

    if (!Task || !TaskBatchStatus) {
      logger.error('Models not loaded correctly - Task/TaskBatchStatus', {
        module: 'taskgroup',
        originalError: 'Models not found'
      });
      return;
    }

    const whereClause = {
      taskGroupId: tg.id,
      ...(tg.dataValues?.status !== "archives" && {
        status: tg._previousDataValues.status,
      }),
    };

    return sequelize.transaction(async (t) => {
      const updatedTask = await Task.update(
        { status: tg.status },
        {
          where: whereClause,
          bypassBefore: true,
          transaction: t,
          individualHooks: true,
        }
      );
      const updatedIds = updatedTask[1].map((task) => task.id);

      await TaskBatchStatus.update(
        { status: tg.status },
        {
          where: {
            taskId: updatedIds,
            course_batch_id: options.batchId,
            status: tg._previousDataValues.status,
          },
        }
      );
    });
  });

  return TaskGroup;
};
