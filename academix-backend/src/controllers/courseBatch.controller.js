const { where } = require("sequelize");
const {
  CourseBatch,
  Axis,
  AxisBatchArchives,
  TaskGroup,
  TaskGroupBatchStatus,
  Task,
  TaskBatchStatus,
  TeamCourseBatch,
  sequelize
} = require("../../models");
const logger = require('../utils/logger');
const { catchError } = require('../utils/errorHandler');

module.exports = {
  getAll: async (req, res) => {
    try {
      const batches = await CourseBatch.findAll();
      res.json(batches);
    } catch (err) {
      catchError(err, req, res, { function: 'getAll' });
    }
  },

  getById: async (req, res) => {
    try {
      const batch = await CourseBatch.findByPk(req.params.id);
      if (batch) res.json(batch);
      else res.status(404).json({ error: "CourseBatch not found" });
    } catch (err) {
      catchError(err, req, res, { function: 'getById', batchId: req.params.id });
    }
  },

  create: async (req, res) => {
    const { courseId, name, start_date, status } = req.body;
    const transaction = await sequelize.transaction();

    try {
      const existingCourseBatch = await CourseBatch.findOne({
        where: { courseId, name },
      });

      if (existingCourseBatch) {
        await transaction.rollback();
        return res.status(409).json({ msg: "Course batch already exists!" });
      }

      const batch = await CourseBatch.create(
        { courseId, name, start_date, status },
        { transaction }
      );

      const previousBatch = await CourseBatch.findOne({
        where: { courseId },
        order: [['start_date', 'DESC']],
        include: [{
          model: TeamCourseBatch,
          as: 'teams',
        }]
      });

      if (previousBatch && previousBatch.teams?.length > 0) {
        const teamLinksData = previousBatch.teams.map(link => ({
          team_id: link.team_id,
          course_batch_id: batch.id,
        }));
        await TeamCourseBatch.bulkCreate(teamLinksData, { transaction });
      }

      const courseAxes = await Axis.findAll({
        where: { courseId },
      });

      if (courseAxes.length > 0) {
        await AxisBatchArchives.bulkCreate(
          courseAxes.map((axis) => ({
            axis_id: axis.id,
            course_batch_id: batch.id,
            repository_kind: axis.repository_kind,
          })),
          { transaction }
        );
      }

      const axeIds = courseAxes.map((a) => a.id);
      const taskGroups = await TaskGroup.findAll({
        
        where: { axisId: axeIds },
      });

      if (taskGroups.length > 0) {
        await TaskGroupBatchStatus.bulkCreate(
          taskGroups.map((taskGroup) => ({
            taskGroupId: taskGroup.id,
            course_batch_id: batch.id,
            status: taskGroup.status,
          })),
          { transaction }
        );
      }

      const tgIds = taskGroups.map((tg) => tg.id);
      const tasks = await Task.findAll({
        where: {
          taskGroupId: tgIds,
          is_active: null
        },
      });

      if (tasks.length > 0) {
        await TaskBatchStatus.bulkCreate(
          tasks.map((task) => ({
            taskId: task.id,
            course_batch_id: batch.id,
            status: task.status,
          })),
          { transaction }
        );
      }

      await transaction.commit();

      logger.info('CourseBatch נוצר', {
        batchId: batch.id,
        courseId,
        name,
        teamsLinked: previousBatch?.teams?.length || 0,
        userId: req.headers['x-user-id']
      });

      res.status(201).json({
        batch: batch,
        teamsLinked: previousBatch?.teams?.length || 0,
        msg: "Course batch created successfully!",
      });
    } catch (err) {
      await transaction.rollback();
      catchError(err, req, res, { function: 'create', courseId, name });
    }
  },

  update: async (req, res) => {
    try {
      const { courseId, name, start_date, end_date } = req.body;
      const batch = await CourseBatch.findByPk(req.params.id);
      if (!batch) return res.status(404).json({ error: "CourseBatch not found" });

      await batch.update({ courseId, name, start_date, end_date });

      logger.info('CourseBatch עודכן', {
        batchId: req.params.id,
        updatedFields: Object.keys(req.body),
        userId: req.headers['x-user-id']
      });

      res.json(batch);
    } catch (err) {
      catchError(err, req, res, { function: 'update', batchId: req.params.id });
    }
  },

  remove: async (req, res) => {
    try {
      const batch = await CourseBatch.findByPk(req.params.id);
      if (!batch) return res.status(404).json({ error: "CourseBatch not found" });

      await batch.destroy();

      logger.info('CourseBatch נמחק', {
        batchId: req.params.id,
        userId: req.headers['x-user-id']
      });

      res.json({ message: "Deleted successfully" });
    } catch (err) {
      catchError(err, req, res, { function: 'remove', batchId: req.params.id });
    }
  },

  getAllowedCourseBatches: async (req, res) => {
    try {
      const { allowedCourseBatcheIds } = req.query;

      if (!allowedCourseBatcheIds || typeof allowedCourseBatcheIds !== "string") {
        return res.json([]);
      }

      const numericIds = allowedCourseBatcheIds
        .split(",")
        .map((id) => Number(id.trim()))
        .filter((id) => !isNaN(id));

      if (numericIds.length === 0) {
        return res.json([]);
      }

      const CourseBatches = await CourseBatch.findAll({
        where: { id: numericIds },
        order: [["id", "ASC"]],
      });

      res.json(CourseBatches);
    } catch (error) {
      catchError(error, req, res, { function: 'getAllowedCourseBatches' });
    }
  },
};