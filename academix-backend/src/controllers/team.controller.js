const { Team, Axis, TaskGroup, Task, File, sequelize, TeamCourseBatch, CourseBatch, Course } = require("../../models");
const { deleteFileRecords, deleteUnreferencedObjects } = require("../services/fileCleanup.service");
const logger = require('../utils/logger');
const { catchError } = require('../utils/errorHandler');

exports.getAll = async (req, res) => {
  const teams = await Team.findAll();
  res.json(teams);
};

exports.getById = async (req, res) => {
  const team = await Team.findByPk(req.params.id);
  if (!team) return res.status(404).send("Team not found");
  res.json(team);
};

exports.create = async (req, res) => {
  const { course_batch_id, courseId, name } = req.body;
  const transaction = await sequelize.transaction();

  try {
    // ✅ בדיקה: האם קיים צוות עם השם הזה באותו קורס
    const existingTeamInCourse = await Team.findOne({
      where: {
        name: name,
        courseId: courseId,  // ← בדיקה לפי קורס!
      },
    });

    if (existingTeamInCourse) {
      await transaction.rollback();
      return res.status(409).json({
        msg: "צוות עם שם זה כבר קיים בקורס זה!",
      });
    }

    // בדיקה: האם קיים צוות עם השם וללא קורס
    const existingTeamWithoutCourse = await Team.findOne({
      where: {
        name: name,
        courseId: null,
      },
    });

    if (existingTeamWithoutCourse) {
      // אם צוות קיים ללא קורס - נעדכן את ה-courseId שלו
      existingTeamWithoutCourse.courseId = courseId;
      await existingTeamWithoutCourse.save({ transaction });

      // נוסיף גם קישור למחזור
      const existingLink = await TeamCourseBatch.findOne({
        where: {
          team_id: existingTeamWithoutCourse.id,
          course_batch_id: course_batch_id,
        },
      });

      if (!existingLink) {
        await TeamCourseBatch.create(
          {
            team_id: existingTeamWithoutCourse.id,
            course_batch_id: course_batch_id,
          },
          { transaction }
        );
      }

      await transaction.commit();

      logger.info('Team updated and linked to course', {
        teamId: existingTeamWithoutCourse.id,
        courseId: courseId,
        courseBatchId: course_batch_id,
        name: name,
        userId: req.headers['x-user-id']
      });

      return res.status(201).json({
        team: existingTeamWithoutCourse,
        link: { team_id: existingTeamWithoutCourse.id, course_batch_id: course_batch_id },
        msg: "הצוות עודכן וקושר לקורס בהצלחה!",
      });
    }

    // יצירת Team חדש
    const team = await Team.create(
      {
        name: name,
        courseId: courseId,  // ← הוספת courseId
      },
      { transaction }
    );

    // יצירת הקישור בטבלת החיבור
    await TeamCourseBatch.create(
      {
        team_id: team.id,
        course_batch_id: course_batch_id,
      },
      { transaction }
    );

    await transaction.commit();

    logger.info('Team created', {
      teamId: team.id,
      courseId: courseId,
      courseBatchId: course_batch_id,
      name: name,
      userId: req.headers['x-user-id']
    });

    res.status(201).json({
      team: team,
      link: { team_id: team.id, course_batch_id: course_batch_id },
      msg: "הצוות נוצר וקושר בהצלחה!",
    });

  } catch (error) {
    await transaction.rollback();
    logger.error("team.create failed", { originalError: error.message, stack: error.stack });
    res.status(500).json({ msg: "שגיאת שרת" });
  }
};

exports.update = async (req, res) => {
  const { course_batch_id, name } = req.body;
  const [updated] = await Team.update(
    { course_batch_id, name },
    {
      where: { id: req.params.id },
    }
  );
  if (!updated) return res.status(404).send("Team not found");

  logger.info('Team updated', {
    teamId: req.params.id,
    updatedFields: { course_batch_id, name },
    userId: req.headers['x-user-id']
  });

  res.send("Updated successfully");
};

exports.remove = async (req, res) => {
  const teamId = req.params.id;
  try {
    // Axes -> task groups -> tasks -> files, one query per level (it was one query per axis, per
    // task group and per task, then one deleteFile() per file). The Files rows go in the same
    // transaction as the team; their S3 objects are deleted after the commit, so a team that is
    // not found (404) or a failed delete no longer loses its files.
    const transaction = await sequelize.transaction();
    let reletedAxes;
    let s3Objects;
    try {
      reletedAxes = await Axis.findAll({ where: { team_id: teamId }, attributes: ["id"], transaction });
      const axisIds = reletedAxes.map((a) => a.id);
      const taskGroups = axisIds.length
        ? await TaskGroup.findAll({ where: { axisId: axisIds }, attributes: ["id"], transaction })
        : [];
      const taskGroupIds = taskGroups.map((tg) => tg.id);
      const tasks = taskGroupIds.length
        ? await Task.findAll({ where: { taskGroupId: taskGroupIds }, attributes: ["id"], transaction })
        : [];
      const taskIds = tasks.map((t) => t.id);
      s3Objects = taskIds.length ? await deleteFileRecords({ task_id: taskIds }, transaction) : [];

      const deleted = await Team.destroy({ where: { id: teamId }, transaction });
      if (!deleted) {
        await transaction.rollback();
        return res.status(404).send("Team not found");
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
    const s3Result = await deleteUnreferencedObjects(s3Objects);

    logger.info('Team deleted', {
      teamId: teamId,
      axesDeleted: reletedAxes?.length || 0,
      filesCount: s3Objects.length,
      s3: s3Result,
      userId: req.headers['x-user-id']
    });

    res.send("Deleted successfully");
  } catch (error) {
    // Was 401 + the raw error object: an unexpected error, not an authentication or business one.
    catchError(error, req, res, { function: "team.delete" });
  }
};

exports.getAllowedTeams = async (req, res) => {
  try {
    const { allowedTeamsIds } = req.query;

    if (!allowedTeamsIds || typeof allowedTeamsIds !== "string") {
      return res.json([]);
    }

    const numericIds = allowedTeamsIds
      .split(",")
      .map((id) => Number(id.trim()))
      .filter((id) => !isNaN(id));

    if (numericIds.length === 0) {
      return res.json([]);
    }

    // ✅ שליפה עם נתוני המחזור מטבלת החיבור
    const teams = await Team.findAll({
      where: {
        id: numericIds,
      },
      include: [
        {
          model: TeamCourseBatch,
          as: 'courseBatches',
          include: [
            {
              model: CourseBatch,
              as: 'courseBatch',
            }
          ]
        },
        {
          model: Course,
          as: 'course',
        }
      ],
      order: [["id", "ASC"]],
    });
    res.json(teams);
  } catch (error) {
    catchError(error, req, res);
  }
};
