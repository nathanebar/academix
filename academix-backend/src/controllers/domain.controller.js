const { Domain, Course, Axis, TaskGroup, Task, GradeStages, sequelize } = require("../../models");
const { deleteFileRecords, deleteUnreferencedObjects } = require("../services/fileCleanup.service");
const logger = require('../utils/logger');
const { catchError } = require('../utils/errorHandler');

exports.getAllDomains = async (req, res) => {
  try {
    const domains = await Domain.findAll();
    res.json(domains);
  } catch (err) {
    catchError(err, req, res, { function: 'getAllDomains' });
  }
};

exports.getDomainById = async (req, res) => {
  try {
    const domain = await Domain.findByPk(req.params.id);
    if (!domain) return res.status(404).json({ error: "Domain not found" });
    res.json(domain);
  } catch (err) {
    catchError(err, req, res, { function: 'getDomainById', domainId: req.params.id });
  }
};

exports.createDomain = async (req, res) => {
  try {
    const domain = await Domain.create(req.body);

    logger.info('Domain נוצר', {
      domainId: domain.id,
      name: req.body.name,
      userId: req.headers['x-user-id']
    });

    res.status(201).json(domain);
  } catch (err) {
    catchError(err, req, res, { function: 'createDomain' });
  }
};

exports.updateDomain = async (req, res) => {
  try {
    const domain = await Domain.findByPk(req.params.id);
    if (!domain) return res.status(404).json({ error: "Domain not found" });

    await domain.update(req.body);

    logger.info('Domain עודכן', {
      domainId: req.params.id,
      updatedFields: Object.keys(req.body),
      userId: req.headers['x-user-id']
    });

    res.json(domain);
  } catch (err) {
    catchError(err, req, res, { function: 'updateDomain', domainId: req.params.id });
  }
};

// Deletes a domain and everything under it in ONE transaction: if any step fails, nothing is
// deleted. Same rows as before (grade stages and their tasks, axes, task groups, tasks, their
// files, courses), selected level by level with IN (...) instead of nested loops. The files'
// S3 objects are removed only after the commit (an S3 delete cannot be rolled back).
const ids = (rows) => rows.map((row) => row.id);

exports.deleteDomain = async (req, res) => {
  const domainId = req.params.id;
  try {
    const s3Objects = [];

    const found = await sequelize.transaction(async (transaction) => {
      const courseIds = ids(
        await Course.findAll({ where: { domainId }, attributes: ["id"], transaction })
      );

      if (courseIds.length > 0) {
        // Grade stages: their tasks (and the tasks' files), then the grade stages
        const gradeStageIds = ids(
          await GradeStages.findAll({ where: { course_id: courseIds }, attributes: ["id"], transaction })
        );
        if (gradeStageIds.length > 0) {
          const gradeStageTaskIds = ids(
            await Task.findAll({ where: { gradeStageId: gradeStageIds }, attributes: ["id"], transaction })
          );
          if (gradeStageTaskIds.length > 0) {
            s3Objects.push(...(await deleteFileRecords({ task_id: gradeStageTaskIds }, transaction)));
            await Task.destroy({ where: { id: gradeStageTaskIds }, transaction });
          }
          await GradeStages.destroy({ where: { id: gradeStageIds }, transaction });
        }

        // Axes -> task groups -> tasks (and their files)
        const axisIds = ids(
          await Axis.findAll({ where: { courseId: courseIds }, attributes: ["id"], transaction })
        );
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
              await Task.destroy({ where: { taskGroupId: taskGroupIds }, transaction });
            }
            await TaskGroup.destroy({ where: { axisId: axisIds }, transaction });
          }
          await Axis.destroy({ where: { courseId: courseIds }, transaction });
        }

        await Course.destroy({ where: { domainId }, transaction });
      }

      const domain = await Domain.findByPk(domainId, { transaction });
      if (!domain) return false;
      await domain.destroy({ transaction });
      return true;
    });

    if (!found) return res.status(404).json({ error: "Domain not found" });

    const s3Result = await deleteUnreferencedObjects(s3Objects);

    logger.info('Domain נמחק', {
      domainId,
      s3ObjectsDeleted: s3Result.deleted,
      s3ObjectsKept: s3Result.kept,
      s3ObjectsFailed: s3Result.failed,
      userId: req.headers['x-user-id']
    });

    res.json({ message: "Domain deleted successfully" });
  } catch (err) {
    catchError(err, req, res, { function: 'deleteDomain', domainId });
  }
};

exports.getAllowedDomains = async (req, res) => {
  try {
    const { allowedDomainsIds } = req.query;

    if (!allowedDomainsIds || typeof allowedDomainsIds !== "string") {
      return res.json([]);
    }

    const numericIds = allowedDomainsIds
      .split(",")
      .map((id) => Number(id.trim()))
      .filter((id) => !isNaN(id));

    if (numericIds.length === 0) {
      return res.json([]);
    }

    const domains = await Domain.findAll({
      where: { id: numericIds },
      order: [["id", "ASC"]],
    });

    res.json(domains);
  } catch (error) {
    catchError(error, req, res, { function: 'getAllowedDomains' });
  }
};