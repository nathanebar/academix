const { where } = require("sequelize");
const { sequelize } = require("../../models/index");
const { CourseBatch, Axis, AxisBatchArchives, User, Task, TaskGroup, TaskAssignment } = require("../../models");
const logger = require('../utils/logger');
const { catchError } = require('../utils/errorHandler');

module.exports = {
  getAllowedAxisBatchArchive: async (req, res) => {
    try {
      const { allowedAxisBatchIds } = req.query;
      const { teammemberid,notstudentrole } = req.headers;  

   
      
      if (!allowedAxisBatchIds || typeof allowedAxisBatchIds !== "string") {
        return res.json([]);
      }

      const numericIds = allowedAxisBatchIds
        .split(",")
        .map((id) => Number(id.trim()))
        .filter((id) => !isNaN(id));

      if (numericIds.length === 0) {
        return res.json([]);
      }

      
      
      let allowedAxisIds = null;
      if (teammemberid && !notstudentrole) {
        const teamMemberId = Number(teammemberid);
        
        const taskAssignments = await TaskAssignment.findAll({
          where: { user_id: teamMemberId },
          attributes: ["task_id"],
          raw: true,
        });
        const taskIds = [...new Set(taskAssignments.map(ta => ta.task_id))];
        
        if (taskIds.length > 0) {
          const tasksWithAxis = await Task.findAll({
            where: { id: { [require("sequelize").Op.in]: taskIds } },
            attributes: [],
            include: [{
              model: TaskGroup,
              as: "TaskGroup",
              attributes: ["axisId"],
              required: true,
            }],
            raw: true,
            nest: true,
          });
          
          allowedAxisIds = [...new Set(
            tasksWithAxis.map(t => t.TaskGroup?.axisId).filter(Boolean)
          )];
        }
      }

      const whereCondition = { course_batch_id: numericIds };
      
      if (allowedAxisIds && allowedAxisIds.length > 0) {
        whereCondition.axis_id = { [require("sequelize").Op.in]: allowedAxisIds };
      }

      const CourseBatches = await AxisBatchArchives.findAll({
        where: whereCondition,
        order: [["id", "ASC"]],
        attributes: [
          [sequelize.col("axis_id"), "id"],
          [sequelize.col("Axis.name"), "name"],
          [sequelize.col("Axis.team_id"), "team_id"],
          [sequelize.col("Axis.color"), "color"],
          [sequelize.col("AxisBatchArchives.repository_kind"), "repository_kind"],
          [sequelize.col("Axis->creator.name"), "creatorName"],
        ],
        include: [
          {
            model: Axis,
            attributes: [],
            paranoid: true,
            required: true,
            include: [
              {
                model: User,
                as: "creator",
                attributes: [],
              },
            ],
          },
        ],
        raw: true,
        nest: false,
      });

      res.json(CourseBatches);
    } catch (error) {
      catchError(error, req, res, { function: 'getAllowedAxisBatchArchive' });
    }
  },
};