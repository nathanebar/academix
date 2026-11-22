"use strict";
const { Model } = require("sequelize");
const { sequelize } = require("../models/index");
module.exports = (sequelize, DataTypes) => {
  class Axis extends Model {
    static associate(models) {
      Axis.belongsTo(models.Course, {
        foreignKey: "courseId",
        onDelete: "CASCADE",
        constraints: true,
      });
      Axis.belongsTo(models.User, {
        as: "creator",
        foreignKey: "creator_id",
        constraints: false,
      });
      Axis.hasMany(models.TaskGroup, { foreignKey: "axisId" });
      Axis.hasMany(models.AxisBatchArchives, { foreignKey: "axis_id" });
      Axis.belongsTo(models.Team, {
        foreignKey: "team_id",
        allowNull: true,
      });
    }
  }
  Axis.init(
    {
      creator_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "Users",
          key: "id",
        },
      },
      courseId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Courses",
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
      color: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      // isActive: {
      //   type: DataTypes.BOOLEAN,
      //   defaultValue: true,
      // },
      repository_kind: {
        type: DataTypes.ENUM("operational", "assignment_bank", "archives"),
        allowNull: false,
      },
      deletedAt: {
        // 👈 הוספתי
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      sequelize,
      modelName: "Axis",
      paranoid: true,
      indexes: [
        { name: "axes_course_id_idx", fields: ["courseId"] },
        { name: "axes_team_id_idx", fields: ["team_id"] },
      ],
    }
  );

  Axis.addHook("afterUpdate", async (axe, options) => {
    if (!axe.changed("repository_kind")) return;
    if (options.bypassHook) return;

    const { TaskGroup, TaskGroupBatchStatus } = sequelize.models;

    if (!TaskGroup || !TaskGroupBatchStatus) {
      logger.error("Models not loaded correctly in axis", {
        module: "axis",
        originalError: "TaskGroup or TaskGroupBatchStatus not found",
      });
      return;
    }

    const whereClause = {
      axisId: axe.id,
      ...(axe.dataValues?.repository_kind !== "archives" && {
        status: axe._previousDataValues.repository_kind,
      }),
    };

    return sequelize.transaction(async (t) => {
      const updatedTaskGroups = await TaskGroup.update(
        { status: axe.repository_kind },
        {
          where: whereClause,
          transaction: t,
          batchId: options.batchId,
          bypassBefore: true,
          individualHooks: true,
        }
      );
      const updatedIds = updatedTaskGroups[1].map((taskGroup) => taskGroup.id);

      await TaskGroupBatchStatus.update(
        { status: axe.repository_kind },
        {
          where: {
            taskGroupId: updatedIds,
            course_batch_id: options.batchId,
            status: axe._previousDataValues.repository_kind,
          },
        }
      );
    });
  });

  return Axis;
};
