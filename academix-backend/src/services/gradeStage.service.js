const {
  Axis,
  Team,
  CourseBatch,
  Task,
  TaskGroup,
  TaskAssignment,
  GradeStages,
  TeamCourseBatch,
  TeamMember
} = require("../../models");
const Sequelize = require("sequelize");
const logger = require("../utils/logger");
const { Op, fn, col } = Sequelize;

async function createGradeStage(courseId, name) {
  try {
    const existGradeStage = await GradeStages.findOne({
      where: {
        course_id: courseId,
        name: name,
      },
    });
    if (existGradeStage) {
      return { error: "there is already this grade stage in this course!" };
    }
    const gradeStage = await GradeStages.create({
      course_id: courseId,
      name: name,
    });
    return gradeStage;
  } catch (error) {
    logger.error("gradeStage.service.createGradeStage failed", { originalError: error.message, stack: error.stack });
    return;
  }
}

async function getGradeStageByCourseId(courseId) {
  try {
    const gradeStageRecord = await GradeStages.findAll({
      where: {
        course_id: courseId,
      },
    });
    return gradeStageRecord;
  } catch (error) {
    logger.error("gradeStage.service.getGradeStageByCourseId failed", { originalError: error.message, stack: error.stack });
  }
}

async function deleteGradeStage(id) {
  try {
    const existGradeStage = await GradeStages.findOne({
      where: {
        id: id,
      },
    });
    if (!existGradeStage) {
      return { error: "there is not grade stage with that id!" };
    }

    // Check if there are tasks with this gradeStageId and set them to null
    const tasksToUpdate = await Task.findAll({
      where: {
        gradeStageId: id,
      },
    });

    if (tasksToUpdate.length > 0) {
      // Update all tasks to set gradeStageId to null
      await Task.update(
        { gradeStageId: null },
        {
          where: {
            gradeStageId: id,
          },
        }
      );
    }

    // Now delete the grade stage
    const deletedGradeStage = await GradeStages.destroy({
      where: {
        id: id,
      },
    });

    if (deletedGradeStage > 0) {
      return { data: { success: true } };
    }
    return { error: "error in delete grade stage!" };
  } catch (error) {
    logger.error("gradeStage.service.deleteGradeStage failed", { originalError: error.message, stack: error.stack });
    return { error: "An error occurred while deleting the grade stage" };
  }
}

async function updateGradeStage(id, newName) {
  try {
    const existGradeStage = await GradeStages.findOne({
      where: {
        id: id,
      },
    });
    if (!existGradeStage) {
      return { error: "there is no grade stage with this id!" };
    }
    const updatedGradeStage = await GradeStages.update(
      {
        name: newName,
      },
      {
        where: {
          id: id,
        },
      }
    );
    if (updatedGradeStage?.[0] > 0) {
      return { data: { success: true } };
    }
    return { error: "error in update grade stage!" };
  } catch (error) {
    logger.error("gradeStage.service.updateGradeStage failed", { originalError: error.message, stack: error.stack });
    return;
  }
}

async function getTeamsByCourseId(courseId) {
  try {
    // 1. קבלת כל המחזורים של הקורס
    const courseBatches = await CourseBatch.findAll({
      where: { courseId: courseId },
      attributes: ["id"],
    });
    
    const courseBatchesIds = courseBatches?.map(i => i?.id);
    
    if (!courseBatchesIds?.length) {
      return [];
    }

    // 2. שליפת כל הצוותים בבת אחת
    const teams = await Team.findAll({
      include: [
        {
          model: TeamCourseBatch,
          as: 'courseBatches',
          where: {
            course_batch_id: { [Op.in]: courseBatchesIds },
          },
          required: true,
        }
      ],
    });

    return teams;
    
  } catch (error) {
    logger.error("gradeStage.service.getTeamsByCourseId failed", { originalError: error.message, stack: error.stack });
    return [];
  }
}

async function getTaskAssignmentsByTeamIds(teamIds, userIdCondition, selectedCourseBatch) {
  try {
        const whereCondition = {
      team_id: { [Op.in]: teamIds },
    };

    // ✅ הוסף סינון לפי מחזור דרך userIdCondition
    if (userIdCondition && Object.keys(userIdCondition).length > 0) {
      whereCondition.team_id = userIdCondition;
    }
    const TaskAssignments = await TaskAssignment.findAll({
      where: whereCondition,
      attributes: ["id", "completed", "team_id", "team_id"],
      include: [
        {
          model: Task,
          required: true,
          attributes: ["gradeStageId"],
          include: [
            {
              model: GradeStages,
              as: "GradeStages",
              required: true,
              attributes: ["id", "name"],
            },
          ],
        },
      ],
    });
    return TaskAssignments;
  } catch (error) {
    logger.error("gradeStage.service.getTaskAssignmentsByTeamIds failed", { originalError: error.message, stack: error.stack });
  }
}

async function getTasksByTeamIds(teamIds, selectedCourseBatch) {
  if (!Array.isArray(teamIds) || teamIds.length === 0) return [];

  try {
    // ✅ תיקון: שליפת courseIds ישירות מטבלת Team
    const teams = await Team.findAll({
      attributes: ["id", "courseId"],
      where: { id: { [Op.in]: teamIds } },
      raw: true,
    });

    const courseIds = teams.map((t) => t.courseId).filter(Boolean);
    
    // בניית תנאי לשליפת Axes
    const axisWhere = {
      [Op.or]: [
        { team_id: { [Op.in]: teamIds } },
        { courseId: { [Op.in]: courseIds } },
      ],
    };

      let taskAssignmentWhere = {};
    if (selectedCourseBatch) {
      // שליפת מזהי חברי הצוות לפי מחזור
      const teamMembers = await TeamMember.findAll({
        where: {
          team_id: { [Op.in]: teamIds },
          course_batch_id: Number(selectedCourseBatch),
        },
        attributes: ["id"],
        raw: true,
      });
      const memberIds = teamMembers.map(m => m.id);
      
      taskAssignmentWhere = {
        team_id: { [Op.in]: memberIds }
      };
    }
    // שליפת המשימות
    const Tasks = await Task.findAll({
      include: [
        {
          model: TaskGroup,
          include: [
            {
              model: Axis,
              where: axisWhere,
            },
          ],
        },
        {
          model: GradeStages,
          as: "GradeStages",
          attributes: ["id", "name"],
        },
         {
          model: TaskAssignment,
          as: "TaskAssignments",
          where: taskAssignmentWhere,
          required: Object.keys(taskAssignmentWhere).length > 0,
          attributes: [],
        },
      ],
    });

    return Tasks;

  } catch (error) {
    logger.error("gradeStage.service.getTasksByTeamIds failed", { originalError: error.message, stack: error.stack });
    return [];
  }
}

module.exports = {
  createGradeStage,
  getGradeStageByCourseId,
  deleteGradeStage,
  updateGradeStage,
  getTaskAssignmentsByTeamIds,
  getTeamsByCourseId,
  getTasksByTeamIds,
};
