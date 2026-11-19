const { Domain, Course, Axis, TaskGroup, Task, File, GradeStages } = require("../../models");
const fileController = require("../controllers/file.controller");
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

exports.deleteDomain = async (req, res) => {
  const domainId = req.params.id;
  try {
    const reletedCourses = await Course.findAll({
      where: { domainId: domainId },
    });

    if (reletedCourses && reletedCourses?.length > 0) {
      for (const c of reletedCourses) {
        const reletedGradeStages = await GradeStages.findAll({
          where: { course_id: c?.id },
        });

        if (reletedGradeStages && reletedGradeStages?.length > 0) {
          for (const gs of reletedGradeStages) {
            const reletedTasksInGradeStage = await Task.findAll({
              where: { gradeStageId: gs?.id },
            });

            if (reletedTasksInGradeStage && reletedTasksInGradeStage?.length > 0) {
              for (const t of reletedTasksInGradeStage) {
                const reletedFiles = await File.findAll({
                  where: { task_id: t?.id },
                });
                if (reletedFiles && reletedFiles?.length > 0) {
                  for (const f of reletedFiles) {
                    await fileController.deleteFile(f?.id);
                  }
                }
                await Task.destroy({ where: { id: t?.id } });
              }
            }
            await GradeStages.destroy({ where: { id: gs?.id } });
          }
        }

        const reletedAxes = await Axis.findAll({
          where: { courseId: c?.id },
        });

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
                  await Task.destroy({ where: { taskGroupId: tg?.id } });
                }
              }
              await TaskGroup.destroy({ where: { axisId: a?.id } });
            }
          }
          await Axis.destroy({ where: { courseId: c?.id } });
        }
      }
      await Course.destroy({ where: { domainId: domainId } });
    }

    const domain = await Domain.findByPk(domainId);
    if (!domain) return res.status(404).json({ error: "Domain not found" });

    await domain.destroy();

    logger.info('Domain נמחק', {
      domainId,
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