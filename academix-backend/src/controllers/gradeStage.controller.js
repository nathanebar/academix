const {
  createGradeStage,
  getGradeStageByCourseId,
  deleteGradeStage,
  updateGradeStage,
  getTeamsByCourseId,
  getTaskAssignmentsByTeamIds,
  getTasksByTeamIds,
} = require("../services/gradeStage.service");
const { TeamMember } = require("../../models");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const { toNumberArray } = require("../utils/toNumberArray");
const logger = require('../utils/logger');
const { catchError } = require('../utils/errorHandler');

module.exports = {
  async getByCourseId(req, res) {
    const {
      //  userId,
      courseid,
    } = req.headers;
    try {
      const gradeStages = await getGradeStageByCourseId(courseid);
      res.status(200).json(gradeStages);
    } catch (error) {
      catchError(error, req, res, { function: 'getByCourseId', courseId: courseid });
    }
  },
  async getCountByTeamsIds(req, res) {
    const teamIds = req.headers?.teamids;
    const courseId = req.headers?.courseid;
    const selectedCourseBatch = req.headers?.selectedcoursebatch;  // ✅



    try {
      if (!teamIds && !courseId) {
        res.status(400).json({ error: "no cradentials sent!" });
        return;
      }

      let teamIdsToFetchTaskAssignments;
      if (teamIds) {
        const ids = toNumberArray(teamIds);
        teamIdsToFetchTaskAssignments = ids;
      } else if (courseId) {
        const teams = await getTeamsByCourseId(courseId);
        teamIdsToFetchTaskAssignments = teams?.map((i) => i?.id);
      }

      if (!teamIdsToFetchTaskAssignments?.length) {
        res.status(400).json({ error: "no teamIdsToFetchTaskAssignments" });
        return;
      }

      // ✅ בניית תנאי לפי מחזור
      let teamMemberCondition = {};
      let userIdCondition = {};

      if (selectedCourseBatch) {
        const teamMembersData = await TeamMember.findAll({
          where: {
            team_id: { [Op.in]: teamIdsToFetchTaskAssignments },
            course_batch_id: Number(selectedCourseBatch)
          },
          attributes: ["id"],
          raw: true,
        });

        const validUserIds = teamMembersData.map(m => m.id);

        if (validUserIds.length === 0) {
          res.status(200).json({
            percentByGradeStage: [],
            message: "אין חברי צוות במחזור זה"
          });
          return;
        }

        teamMemberCondition = {
          member_role: "STUDENT",
          team_id: { [Op.in]: teamIdsToFetchTaskAssignments },
          course_batch_id: Number(selectedCourseBatch)
        };

        userIdCondition = { [Op.in]: validUserIds };
      } else {
        teamMemberCondition = {
          member_role: "STUDENT",
          team_id: { [Op.in]: teamIdsToFetchTaskAssignments },
        };
      }

      const teamMembers = await TeamMember.count({
        where: teamMemberCondition,  // ✅ כולל סינון לפי מחזור
      });

      if (!teamMembers || teamMembers === 0) {
        res.status(400).json({ error: "no teamMembers" });
        return;
      }

      // ✅ העברת הסינון לפונקציות
      const tasks = await getTasksByTeamIds(
        teamIdsToFetchTaskAssignments,
        selectedCourseBatch  // ✅
      );

      if (!tasks || tasks?.length === 0) {
        res.status(400).json({ error: "no tasks" });
        return;
      }

      const tasksByStage = {};
      tasks.forEach((t) => {
        const stage = t?.dataValues?.GradeStages;
        if (!stage) return;
        const sid = stage.id;
        tasksByStage[sid] = (tasksByStage[sid] ?? 0) + 1;
      });

      // ✅ שליפת TaskAssignments עם סינון לפי מחזור
      const reletedTaskAssignments = await getTaskAssignmentsByTeamIds(
        teamIdsToFetchTaskAssignments,
        userIdCondition ,
        selectedCourseBatch
      );

      if (!reletedTaskAssignments || reletedTaskAssignments?.length === 0) {
        res.status(200).json({ error: "no reletedTaskAssignments found!" });
        return;
      }

      const completedByStage = {};
      reletedTaskAssignments.forEach((ta) => {
        const stage = ta?.dataValues?.Task?.GradeStages;
        if (!stage) return;
        const sid = stage.id;
        if (ta.completed) {
          completedByStage[sid] = (completedByStage[sid] ?? 0) + 1;
        }
      });

      const percentByGradeStage = Object.entries(tasksByStage).map(
        ([stageId, tasksInStage]) => {
          const totalPossible = teamMembers * tasksInStage;
          const completed = completedByStage[stageId] ?? 0;
          const percent = totalPossible
            ? Number(((completed / totalPossible) * 100).toFixed(0))
            : 0;
          return {
            gradeStageId: Number(stageId),
            gradeStageName: tasks.find((t) => t?.GradeStages?.id == stageId)
              ?.GradeStages?.name,
            totalPossible,
            completed,
            percent,
          };
        }
      );

      res.status(200).json({ percentByGradeStage });

    } catch (error) {
      catchError(error, req, res, { function: 'getCountByTeamsIds' });
    }
  },

  async create(req, res) {
    const { courseid, name } = req.body;
    try {
      const gradeStage = await createGradeStage(courseid, name);
      if (gradeStage?.error) {
        res.status(409).json(gradeStage);
      } else {
        logger.info('GradeStage created', {
          gradeStageId: gradeStage?.id,
          courseId: courseid,
          name: name,
          userId: req.headers['x-user-id']
        });
        
        res.status(200).json(gradeStage);
      }
    } catch (err) {
      catchError(err, req, res, { function: 'create', courseid, name });
    }
  },

  async update(req, res) {
    const { id, name } = req.body;
    try {
      const updatedGradeStage = await updateGradeStage(id, name);
      if (updatedGradeStage?.error) {
        res.status(409).json(updatedGradeStage);
      } else {
        logger.info('GradeStage updated', {
          gradeStageId: id,
          name: name,
          userId: req.headers['x-user-id']
        });
        
        res.status(200).json(updatedGradeStage);
      }
    } catch (err) {
      catchError(err, req, res, { function: 'update', gradeStageId: id, name });
    }
  },

  async delete(req, res) {
    const {
      //  userId,
      id,
    } = req.headers;
    try {
      const deletedGradeStage = await deleteGradeStage(id);
      if (deletedGradeStage?.error) {
        res.status(409).json(deletedGradeStage);
      } else {
        logger.info('GradeStage deleted', {
          gradeStageId: id,
          userId: req.headers['x-user-id']
        });
        
        res.status(200).json(deletedGradeStage);
      }
    } catch (error) {
      catchError(error, req, res, { function: 'delete', gradeStageId: id });
    }
  },
};
