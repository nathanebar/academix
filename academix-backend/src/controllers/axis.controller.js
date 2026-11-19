const {
  Axis,
  Team,
  CourseBatch,
  Task,
  TaskGroup,
  AxisBatchArchives,
  TaskAssignment,
  TeamMember,
  File,
  TaskGroupBatchStatus,
} = require("../../models");
const { getTeamsByCourseId } = require("../services/gradeStage.service");
const fileController = require("../controllers/file.controller");
const { toNumberArray } = require("../utils/toNumberArray");
const Sequelize = require("sequelize");
const { Op, fn, col } = Sequelize;
const logger = require("../utils/logger");
const { catchError } = require("../utils/errorHandler");

exports.getAll = async (req, res) => {
  try {
    const axes = await Axis.findAll();
    res.json(axes);
  } catch (err) {
    catchError(err, req, res, { function: "getAll" });
  }
};

exports.getById = async (req, res) => {
  try {
    const axis = await Axis.findByPk(req.params.id);
    if (!axis) return res.status(404).json({ error: "Axis not found" });
    res.json(axis);
  } catch (err) {
    catchError(err, req, res, { function: "getById" });
  }
};

exports.create = async (req, res) => {
  const { selectedCourseBatch } = req.params;
  try {
    const creatorId = req.headers['x-user-id'] ? Number(req.headers['x-user-id']) : null;

    const axisData = {
      ...req.body,
      creator_id: creatorId,
    };

    const axis = await Axis.create(axisData);

    if (axis) {
      await AxisBatchArchives.create({
        axis_id: axis.id,
        course_batch_id: selectedCourseBatch,
        repository_kind: axis.repository_kind,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    logger.info("Axis created", {
      axisId: axis.id,
      selectedCourseBatch,
      userId: req.headers["x-user-id"],
    });

    res.status(201).json(axis);
  } catch (err) {
    catchError(err, req, res, { function: "create", selectedCourseBatch });
  }
};

exports.update = async (req, res) => {
  const id = req.params.id;
  try {
    const axis = await Axis.findByPk(id);
    if (!axis) return res.status(404).json({ error: "Axis not found" });

    const updateData = {};
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.color) updateData.color = req.body.color;
    if (req.body.repository_kind)
      updateData.repository_kind = req.body.repository_kind;

    await axis.update(updateData, { batchId: req.body.batch_id });

    if (req.body.repository_kind) {
      await AxisBatchArchives.update(
        { repository_kind: req.body.repository_kind },
        {
          where: {
            axis_id: id,
            course_batch_id: req.body.batch_id,
          },
        }
      );
    }

    logger.info("Axis updated", {
      axisId: id,
      updatedFields: Object.keys(updateData),
      userId: req.headers["x-user-id"],
    });

    res.json(axis);
  } catch (err) {
    catchError(err, req, res, { function: "update", axisId: id });
  }
};

exports.remove = async (req, res) => {
  const axisId = req.params.id;
  try {
    //כרגע אני לא מוחק באמת אלא עם עברו 30 יום
    /*  const reletedTaskGroups = await TaskGroup.findAll({
      where: { axisId: axisId },
    });
    if (reletedTaskGroups && reletedTaskGroups?.length > 0) {
      for (const tg of reletedTaskGroups) {
        const reletedTasks = await Task.findAll({
          where: { taskGroupId: tg?.id },
        });
        if (reletedTasks && reletedTasks?.length > 0) {
          for (const t of reletedTasks) {
            const reletedFiles = await File.findAll({
              where: { task_id: t?.id },
            });
            if (reletedFiles && reletedFiles?.length > 0) {
              for (const f of reletedFiles) {
                await fileController.deleteFile(f?.id);
              }
            }
          }
        }
      }
    }
 */

    const axis = await Axis.findByPk(axisId);
    if (!axis) return res.status(404).json({ error: "Axis not found" });

    await axis.destroy(/* { force: true } */);

    logger.info("Axis deleted", {
      axisId,
      userId: req.headers["x-user-id"],
    });

    res.status(200).send();
  } catch (err) {
    catchError(err, req, res, { function: "remove", axisId });
  }
};

exports.getAllowedAxes = async (req, res) => {
  try {
    const { allowedAxesIds, selectedCourseBatch } = req.query;

    if (!allowedAxesIds || typeof allowedAxesIds !== "string") {
      return res.json([]);
    }

    const numericIds = allowedAxesIds
      .split(",")
      .map((id) => Number(id.trim()))
      .filter((id) => !isNaN(id));

    if (numericIds.length === 0) {
      return res.json([]);
    }

    const axes = await Axis.findAll({
      where: { id: numericIds },
      order: [["id", "ASC"]],
      include: [
        {
          model: TaskGroup,
          attributes: ["id"],
        },
      ],
    });

    res.json(axes);
  } catch (error) {
    catchError(error, req, res, { function: "getAllowedAxes" });
  }
};

exports.getTaskCountByAxisId = async (req, res) => {
  const { teamId } = req.params;
  const axisIds = req.headers?.axisids;
  const selectedCourseBatch = req.headers?.selectedcoursebatch;

  try {
    if (!teamId) {
      res.status(400).json({ error: "Teamid not defined!" });
      return;
    }

    const teamIdNum = Number(teamId);
    const axisIdsArray = toNumberArray(axisIds);

    // שליפת כל הצירים
    const axes = await Axis.findAll({
      where: {
        id: { [Op.in]: axisIdsArray },
      },
      attributes: ["id", "name"],
    });

    if (!axes || axes.length === 0) {
      res.status(404).json({ error: "Axis not found" });
      return;
    }

    // בניית תנאים לפי מחזור
    const batchCondition = selectedCourseBatch
      ? { course_batch_id: Number(selectedCourseBatch) }
      : {};

    // מערך תוצאות פר ציר
    const results = [];

    // לולאה על כל ציר
    for (const axis of axes) {
      const axisId = axis.id;
      const axisName = axis.name;

      // שליפת קבוצות משימות של הציר הנוכחי
      const taskGroups = await TaskGroup.findAll({
        where: {
          axisId: axisId,
          [Op.or]: [{ team_id: teamIdNum }, { team_id: null }],
        },
        include: [
          {
            model: TaskGroupBatchStatus,
            where: {
              ...batchCondition,
              status: "operational",
            },
          },
        ],
      });

      if (!taskGroups.length) {
        results.push({
          axisId,
          name: axisName,
          missionCount: 0,
          completedTaskCount: 0,
          completedPercent: 0,
          totalTaskAssignments: 0,
          taskGroups: [],
        });
        continue;
      }

      const taskGroupIds = taskGroups.map((tg) => tg.id);

      // שליפת משימות
      const tasks = await Task.findAll({
        where: {
          taskGroupId: { [Op.in]: taskGroupIds },
          [Op.or]: [{ team_id: teamIdNum }, { team_id: null }],
          status: "operational",
        },
        attributes: ["id"],
      });

      const missionCount = tasks.length;
      const taskIds = tasks.map((t) => t.id);

      if (taskIds.length === 0) {
        results.push({
          axisId,
          name: axisName,
          missionCount: 0,
          completedTaskCount: 0,
          completedPercent: 0,
          totalTaskAssignments: 0,
          taskGroups: taskGroups.map((tg) => ({
            taskGroupId: tg.id,
            taskGroupName: tg.name,
          })),
        });
        continue;
      }

      // בניית תנאי לשליפת TaskAssignments
      const taskAssignmentWhere = {
        task_id: { [Op.in]: taskIds },
      };

      if (selectedCourseBatch) {
        const teamMembers = await TeamMember.findAll({
          where: {
            team_id: teamIdNum,
            member_role: "STUDENT",
            course_batch_id: Number(selectedCourseBatch),
          },
          attributes: ["id"],
          raw: true,
        });

        if (teamMembers.length === 0) {
          results.push({
            axisId,
            name: axisName,
            missionCount,
            completedTaskCount: 0,
            completedPercent: 0,
            totalTaskAssignments: 0,
            studentCount: 0,
            message: "No team members in this batch",
            taskGroups: taskGroups.map((tg) => ({
              taskGroupId: tg.id,
              taskGroupName: tg.name,
            })),
          });
          continue;
        }

        const validUserIds = teamMembers.map((m) => m.id);
        taskAssignmentWhere.user_id = { [Op.in]: validUserIds };
      }

      const taskAssignments = await TaskAssignment.findAll({
        where: taskAssignmentWhere,
        attributes: ["id", "completed_at"],
      });

      const completedTaskCount = taskAssignments.filter(
        (ta) => ta.completed_at !== null && ta.completed_at !== undefined
      ).length;

      let completedPercent = 0;
      if (taskAssignments.length > 0) {
        completedPercent = Number(
          ((completedTaskCount / taskAssignments.length) * 100).toFixed(0)
        );
      }

      // ספירת סטודנטים
      const teamMemberWhere = {
        team_id: teamIdNum,
        member_role: "STUDENT",
      };

      if (selectedCourseBatch) {
        teamMemberWhere.course_batch_id = Number(selectedCourseBatch);
      }

      const studentCount = await TeamMember.count({
        where: teamMemberWhere,
      });

      // הוספה למערך התוצאות
      results.push({
        axisId,
        name: axisName,
        missionCount,
        completedTaskCount,
        completedPercent,
        totalTaskAssignments: taskAssignments.length,
        studentCount,
        taskGroups: taskGroups.map((tg) => ({
          taskGroupId: tg.id,
          taskGroupName: tg.name,
        })),
      });
    }

    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    catchError(error, req, res, { function: "getTaskCountByAxisId", axisId });
  }
};
