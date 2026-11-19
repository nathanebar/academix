const {
  AssignmentProgress,
  TaskAssignment,
  CheckLists,
  Task,
  File,
  TaskGroup,
  Course,
  User,
  Axis,
  TeamMember,
  Feedback,
  FeedbackCategory,
  FeedbackQuestion,
  FeedbackCategorySelection,
  FeedbackAnswer,
  FeedbackQuestionAnswer,
} = require("../../models");
const { Op } = require("sequelize");
const { sequelize } = require("../../models/index");
const logger = require("../utils/logger");
const { catchError } = require("../utils/errorHandler");

async function createProgress({ taskId, type, itemId }) {
  return AssignmentProgress.create({
    task_assignment_id: taskId,
    progress_type: type,
    item_id: itemId,
  });
}

exports.createAssignmentProgress = async (req, res) => {
  const taskAssId = req.body.data.task_assignment_id;
  const task_id = req.body.data.task_id;

  if (!task_id) return res.status(404).json({ error: "task_id not found" });
  if (!taskAssId)
    return res.status(404).json({ error: "task_assignment_id not found" });

  const taskIds = Array.isArray(taskAssId) ? taskAssId : [taskAssId];

  try {
    const fileRows = await File.findAll({
      where: { task_id: task_id },
      attributes: ["id"],
    });
    const fileIds = fileRows.map((r) => r.dataValues.id);

    const checkListsRow = await CheckLists.findAll({
      where: { task_id: task_id },
      attributes: ["id"],
    });
    const checkLists = checkListsRow.map((r) => r.dataValues.id);

    const task = await Task.findByPk(task_id, {
      attributes: ["formId", "linkUrl", "filesResponse"],
    });

    if (!task) return res.status(404).json({ error: "Task not found" });

    const creations = [];
    taskIds.forEach((taskId) => {
      if (task.dataValues.formId) {
        creations.push(
          createProgress({
            taskId,
            type: "form",
            itemId: task.dataValues.formId,
          })
        );
      }
      if (task.dataValues.linkUrl) {
        creations.push(createProgress({ taskId, type: "link", itemId: null }));
      }
      if (task.dataValues.filesResponse) {
        creations.push(
          createProgress({ taskId, type: "filesResponse", itemId: null })
        );
      }
      fileIds.forEach((fileId) => {
        creations.push(
          createProgress({ taskId, type: "file", itemId: fileId })
        );
      });
      checkLists.forEach(() => {
        creations.push(
          createProgress({ taskId, type: "checklist", itemId: null })
        );
      });
    });

    if (creations.length === 0) {
      return res
        .status(400)
        .json({ error: "Task does not contain any trackable item" });
    }

    const results = await Promise.all(creations);
   
    logger.info('AssignmentProgress records created', {
      taskAssignmentIds: taskIds,
      taskId: task_id,
      progressCount: results.length,
      userId: req.user?.id,
    });

    return res.status(201).json(results);
  } catch (error) {
    /*    console.log("errorrrr ------");
    console.log("errorrrr ------",error);
    
    catchError(error, req, res, {
      taskId: task_id,
      taskAssignmentIds: taskIds,
    }); */
  }
};

exports.getMissionCompleted = async (req, res) => {
  const { task_assignment_id } = req.query;
  const parsedId = Number(task_assignment_id);

  if (!task_assignment_id || isNaN(parsedId) || !Number.isInteger(parsedId)) {
    return res.status(400).json({
      error: "Invalid task_assignment_id. Must be a valid integer.",
    });
  }

  try {
    const assignmentCompleted = await AssignmentProgress.findAll({
      where: { task_assignment_id: parsedId },
      attributes: ["id", "progress_type", "completed_at"],
      order: [["id", "ASC"]],
    });

    if (!assignmentCompleted) {
      return res.status(404).json({ error: "assignment not found" });
    }

    res.json(assignmentCompleted);
  } catch (err) {
    catchError(err, req, res, { taskAssignmentId: parsedId });
  }
};

exports.updateMissionCompleted = async (req, res) => {
  const { id } = req.params;
  const completed_at = new Date();

  try {
    const [affected, [updated]] = await AssignmentProgress.update(
      { completed_at },
      { where: { id }, returning: true }
    );

    if (!affected) {
      return res.status(404).json({ error: "Mission not found" });
    }

    logger.info("Mission completed", {
      missionId: id,
      completedAt: completed_at,
      userId: req.user?.id,
    });

    res.json(updated);
  } catch (err) {
    catchError(err, req, res, { missionId: id });
  }
};

exports.removeMissionCompleted = async (req, res) => {
  const { id } = req.params;

  try {
    const [affected, [updated]] = await AssignmentProgress.update(
      { completed_at: null },
      { where: { id }, returning: true }
    );

    if (!affected) {
      return res.status(404).json({ error: "Mission not found" });
    }

    logger.info("Mission completion removed", {
      missionId: id,
      userId: req.user?.id,
    });

    res.json(updated);
  } catch (err) {
    catchError(err, req, res, { missionId: id });
  }
};

exports.updateTaskAssignmentCompleted = async (req, res) => {
  const { id } = req.params;
  const completed_at = new Date();

  try {
    const updateData = await TaskAssignment.update(
      { completed_at },
      { where: { id } }
    );

    if (!updateData) {
      return res.status(404).json({ error: "TaskAssignments not found" });
    }

    logger.info("TaskAssignment completed", {
      taskAssignmentId: id,
      completedAt: completed_at,
      userId: req.user?.id,
    });

    res.status(201).json(updateData);
  } catch (err) {
    catchError(err, req, res, { taskAssignmentId: id });
  }
};

exports.TaskAssignmentsCompletedByCommander = async (req, res) => {
  const { id } = req.params;
  const { action } = req.body;

  try {
    const task = await TaskAssignment.findByPk(id);

    if (!task) {
      return res.status(404).json({ error: "TaskAssignment not found" });
    }

    if (action === "undo_complete") {
      task.completed_at = null;
    } else {
      task.completed = task.completed ? null : new Date();
      if (!task.completed_at && task.completed) task.completed_at = new Date();
    }

    await task.save();

    logger.info(`TaskAssignment ${task.completed ? "completed" : "cancelled"}`, {
      taskAssignmentId: id,
      action,
      userId: req.user?.id,
    });

    res.status(200).json(task);
  } catch (err) {
    catchError(err, req, res, { taskAssignmentId: id, action });
  }
};

exports.AllTaskAssignmentsCompletedByCommander = async (req, res) => {
  const { id } = req.params;

  try {
    const tasks = await TaskAssignment.findAll({ where: { task_id: id } });

    if (!tasks || tasks.length === 0) {
      return res.status(404).json({ error: "TaskAssignment not found" });
    }

    const allCompleted = tasks.every((t) => t.completed);
    const newCompletedValue = allCompleted ? null : new Date();

    await Promise.all(
      tasks.map((task) => {
        task.completed = newCompletedValue;
        return task.save();
      })
    );

    logger.info(
      `${allCompleted ? "All TaskAssignments cancelled" : "All TaskAssignments completed"}`,
      {
        taskId: id,
        count: tasks.length,
        userId: req.user?.id,
      }
    );

    res.status(200).json(tasks);
  } catch (err) {
    catchError(err, req, res, { taskId: id });
  }
};

exports.GetAssignmentsCompletedByUser = async (req, res) => {
  const { task_assignment_id } = req.query;

  try {
    const assignmentCompleted = await TaskAssignment.findOne({
      where: { id: task_assignment_id },
    });

    if (!assignmentCompleted) {
      return res.status(404).json({ error: "assignment not found" });
    }

    res.json(assignmentCompleted);
  } catch (err) {
    catchError(err, req, res, { taskAssignmentId: task_assignment_id });
  }
};

exports.GetAssignmentsCompletedByTeam = async (req, res) => {
  const { task_id, team_id } = req.query;

  try {
    const assignmentCompleted = await TaskAssignment.findAll({
      where: { task_id: task_id },
      include: [
        {
          model: TeamMember,
          as: "TeamMember",
          attributes: ["id", "user_id"],
          where: { team_id: team_id },
          include: [
            {
              model: User,
              attributes: ["id", "name", "username", "militaryid"],
            },
          ],
        },
      ],
    });

    if (!assignmentCompleted) {
      return res.status(404).json({ error: "assignment not found" });
    }
    const formatDate = (date) => {
      if (!date) return null;
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };
    const result = assignmentCompleted.map((assignment) => {
      const userName =
        assignment.TeamMember?.User?.name ||
        assignment.TeamMember?.User?.username ||
        `User ${assignment.user_id}`;

      return {
        id: assignment.id,
        userId: assignment.user_id,
        teamMemberId: assignment.TeamMember?.id,
        userName: userName,
        username: assignment.TeamMember?.User?.username,
        militaryid: assignment.TeamMember?.User?.militaryid,
        completed: assignment.completed,
        completed_at: assignment.completed_at,
        start: formatDate(assignment.start),
      };
    });

    res.json(result);
  } catch (err) {
    catchError(err, req, res, { taskId: task_id });
  }
};