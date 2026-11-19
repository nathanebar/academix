"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Task extends Model {
    static associate(models) {
      Task.belongsTo(models.TaskGroup, { foreignKey: "taskGroupId" });
      Task.belongsTo(models.User, { foreignKey: "creatorId" });
      Task.hasMany(models.TaskAssignment, { foreignKey: "task_id" });
      Task.belongsTo(models.Feedback, {
        foreignKey: "feedbackId",
        allowNull: true,
      });
      Task.belongsTo(models.Team, {
        foreignKey: "team_id",
        allowNull: true,
      });
      Task.hasMany(models.TaskChecklistOverlap, {
        foreignKey: "task_id",
        as: "checklistOverlap",
        onDelete: "CASCADE",
      });
      Task.hasMany(models.TaskAssignment, {
        as: "taskAssignments",
        foreignKey: "task_id",
        onDelete: "CASCADE",
        constraints: true,
      });
      Task.belongsTo(models.Form, {
        foreignKey: "formId",
        allowNull: true,
        as: 'parentForm',
      });
      Task.belongsTo(models.Form, {
        foreignKey: "surveyId",
        allowNull: true,
        as: 'survey',
      });
      Task.belongsTo(models.GradeStages, {
        foreignKey: "gradeStageId",
        allowNull: true,
        as: "GradeStages",
      });
      Task.belongsToMany(models.Tags, {
        through: models.TaskTags,
        foreignKey: "task_id",
        otherKey: "tag_id",
        as: "tags",
      });
    }
  }
  Task.init(
    {
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      description_to_overlap: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("operational", "assignment_bank", "archives"),
        defaultValue: "operational",
        allowNull: false,
      },
      taskGroupId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "TaskGroups",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      creatorId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "Users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      requiresSubmission: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      linkUrl: {
        type: DataTypes.STRING(10000),
        allowNull: true,
      },
      recommendedTime: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      filesResponse: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      gradeStageId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      formId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "Forms",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      surveyId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "Forms",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      feedbackId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "Feedback",
          key: "id",
        },
      },
      color: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      team_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      is_seen: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      exposure: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      notRequiredToSubmit: {  // 🔥 הוספתי
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      notRequiredToCheck: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      deletedAt: {  // 👈 הוספתי
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      sequelize,
      modelName: "Task",
      paranoid: true,
    }
  );

  Task.addHook("beforeUpdate", async (task, options) => {
    if (
      !task.changed("status") ||
      task.dataValues.status === "archives" ||
      (task.dataValues.status === "assignment_bank" &&
        task._previousDataValues.status === "operational")
    )
      return;
    if (options.bypassBefore) return;
    const { TaskGroup, TaskGroupBatchStatus } = sequelize.models;
    if (!TaskGroup || !TaskGroupBatchStatus) {
      logger.error('Models not loaded correctly in axis', {
        module: 'axis',
        originalError: 'TaskGroup or TaskGroupBatchStatus not found'
      });
      return;
    }
    return sequelize.transaction(async (t) => {
      await TaskGroup.update(
        { status: task.status },
        {
          where: { id: task.taskGroupId },
          bypassHook: true,
          transaction: t,
          individualHooks: true,
          batchId: options.batchId,
        }
      );
      await TaskGroupBatchStatus.update(
        { status: task.status },
        {
          where: {
            taskGroupId: task.taskGroupId,
            course_batch_id: options.batchId,
          },
        }
      );
    });
  });

  return Task;
};