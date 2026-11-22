const { Course, Axis, TaskGroup, Task, sequelize } = require("../../models");
const { deleteFileRecords, deleteUnreferencedObjects } = require("../services/fileCleanup.service");
const logger = require('../utils/logger');
const { catchError } = require('../utils/errorHandler');

module.exports = {
  async getAll(req, res) {
    try {
      const courses = await Course.findAll();
      res.json(courses);
    } catch (err) {
      catchError(err, req, res, { function: 'getAll' });
    }
  },

  async getById(req, res) {
    try {
      const course = await Course.findByPk(req.params.id);
      if (!course) return res.status(404).json({ error: "Course not found" });
      res.json(course);
    } catch (err) {
      catchError(err, req, res, { function: 'getById', courseId: req.params.id });
    }
  },
  async create(req, res) {
    const { name, domainId } = req.body;
    try {
      const existingCourse = await Course.findOne({
        where: { name, domainId },
      });

      if (existingCourse) {
        return res.status(409).json({ msg: "Course already exists!" });
      }

      const course = await Course.create(req.body);

      logger.info('Course created', {
        courseId: course.id,
        name,
        domainId,
        userId: req.headers['x-user-id']
      });

      res.status(201).json(course);
    } catch (err) {
      catchError(err, req, res, { function: 'create', name, domainId });
    }
  },

  async update(req, res) {
    try {
      const course = await Course.findByPk(req.params.id);
      if (!course) return res.status(404).json({ error: "Course not found" });

      await course.update(req.body);

      logger.info('Course updated', {
        courseId: req.params.id,
        updatedFields: Object.keys(req.body),
        userId: req.headers['x-user-id']
      });

      res.json(course);
    } catch (err) {
      catchError(err, req, res, { function: 'update', courseId: req.params.id });
    }
  },

  // Deletes the files of the course's tasks and the course in ONE transaction (the rest is
  // removed by the database's ON DELETE CASCADE); S3 objects are removed after the commit.
  async remove(req, res) {
    const courseId = req.params.id;
    try {
      const s3Objects = [];
      const ids = (rows) => rows.map((row) => row.id);

      const found = await sequelize.transaction(async (transaction) => {
        const course = await Course.findByPk(courseId, { transaction });
        if (!course) return false;

        const axisIds = ids(await Axis.findAll({ where: { courseId }, attributes: ["id"], transaction }));
        if (axisIds.length > 0) {
          const taskGroupIds = ids(
            await TaskGroup.findAll({ where: { axisId: axisIds }, attributes: ["id"], transaction })
          );
          if (taskGroupIds.length > 0) {
            const taskIds = ids(
              await Task.findAll({ where: { taskGroupId: taskGroupIds }, attributes: ["id"], transaction })
            );
            if (taskIds.length > 0) {
              s3Objects.push(...(await deleteFileRecords({ task_id: taskIds }, transaction)));
            }
          }
        }

        await course.destroy({ transaction });
        return true;
      });

      if (!found) return res.status(404).json({ error: "Course not found" });

      const s3Result = await deleteUnreferencedObjects(s3Objects);

      logger.info('Course deleted', {
        courseId,
        s3ObjectsDeleted: s3Result.deleted,
        s3ObjectsKept: s3Result.kept,
        s3ObjectsFailed: s3Result.failed,
        userId: req.headers['x-user-id']
      });

      res.status(200).json({ message: "Course deleted" });
    } catch (err) {
      catchError(err, req, res, { function: 'remove', courseId });
    }
  },

  async getAllowedCourses(req, res) {
    try {
      const { allowedCoursesIds } = req.query;

      if (!allowedCoursesIds || typeof allowedCoursesIds !== "string") {
        return res.json([]);
      }

      const numericIds = allowedCoursesIds
        .split(",")
        .map((id) => Number(id.trim()))
        .filter((id) => !isNaN(id));

      if (numericIds.length === 0) {
        return res.json([]);
      }

      const courses = await Course.findAll({
        where: { id: numericIds },
        order: [["id", "ASC"]],
      });

      res.json(courses);
    } catch (error) {
      catchError(error, req, res, { function: 'getAllowedCourses' });
    }
  },
};