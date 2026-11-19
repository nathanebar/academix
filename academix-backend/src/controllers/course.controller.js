const { Course, Axis, TaskGroup, Task, File } = require("../../models");
const fileController = require("../controllers/file.controller");
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

  async remove(req, res) {
    const courseId = req.params.id;
    try {
      const reletedAxes = await Axis.findAll({ where: { courseId: courseId } });

      if (reletedAxes && reletedAxes?.length > 0) {
        for (const a of reletedAxes) {
          const reletedTaskGroups = await TaskGroup.findAll({
            where: { axisId: a?.id },
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
        }
      }

      const course = await Course.findByPk(courseId);
      if (!course) return res.status(404).json({ error: "Course not found" });

      await course.destroy();

      logger.info('Course deleted', {
        courseId,
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