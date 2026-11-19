const { config } = require("dotenv");
const {
  File,
  FeedbackAnswer,
  Task,
  TaskGroup,
  Axis,
  AxisBatchArchives,
  User,
  CourseBatchFolder,
  CourseBatchFolderFile,
} = require("../../models");
const logger = require("../utils/logger");
const { catchError } = require("../utils/errorHandler");

async function createFile(
  taskId,
  feedback_answer_id,
  file,
  originalFilename,
  fileLength,
  s3Key,
  bucketName,
  isPatbass,
  form_question_id = null,
  task_assignment_id = null,
  isFileResponse = false,
  creatorId = null
) {
  let parsedTaskId = taskId && taskId !== "null" ? parseInt(taskId) : null;
  const parsedFeedbackId =
    feedback_answer_id && feedback_answer_id !== "null"
      ? parseInt(feedback_answer_id)
      : null;
  const parsedLength =
    fileLength && fileLength !== "null" ? Number(fileLength) : null;
  const parsedFormQuestionId = form_question_id
    ? parseInt(form_question_id)
    : null;
  const parsedTaskAssignmentId = task_assignment_id
    ? parseInt(task_assignment_id)
    : null;

  if (!parsedTaskId && parsedFeedbackId) {
    const feedbackAnswer = await FeedbackAnswer.findByPk(parsedFeedbackId);
    if (feedbackAnswer?.task_assignment_id) {
      const { TaskAssignment } = require("../../models");
      const taskAssignment = await TaskAssignment.findByPk(
        feedbackAnswer.task_assignment_id
      );
      parsedTaskId = taskAssignment?.task_id ?? null;
    }
  }

  try {
    const fileRecord = await File.create({
      creator_id: creatorId ?? null,
      task_id: parsedTaskId ?? null,
      feedback_answer_id: parsedFeedbackId ?? null,
      form_question_id: parsedFormQuestionId ?? null,
      task_assignment_id: parsedTaskAssignmentId ?? null,
      s3BucketName: bucketName,
      name: decodeURIComponent(originalFilename),
      size: file.size,
      length: parsedLength,
      type: file.mimetype,
      s3Key,
      isPatbass,
      isFileResponse: isFileResponse,
    });

    return fileRecord;
  } catch (error) {
    console.log(error);
    // catchError(error);
    throw error;
  }
}

async function getFilesByTaskId(taskId) {
  try {
    const filesRecord = await File.findAll({
      where: {
        task_id: taskId,
      },
    });

    return filesRecord;
  } catch (error) {
    // catchError(error);
    console.log(error);
  }
}

async function getFilesBySolutionFileId(solution_file_id) {
  try {
    const TaskfilesSolutionFile = await Task.findAll({
      where: {
        solution_file_id: solution_file_id,
      },
      include: [{ model: File, as: "solutionFile" }],
    });

    return TaskfilesSolutionFile;
  } catch (error) {
    // catchError(error);
    console.log(error);
  }
}

async function getFilesByFeedbackAnswerId(task_assignment_id) {
  try {
    const id =
      task_assignment_id === undefined ||
      task_assignment_id === null ||
      task_assignment_id === "" ||
      task_assignment_id === "null"
        ? null
        : Number(task_assignment_id);

    const files = await File.findAll({
      include: [
        {
          model: FeedbackAnswer,
          as: "feedbackAnswer",
          attributes: ["id"],
          where: {
            task_assignment_id: id,
          },
        },
      ],
    });

    return files;
  } catch (err) {
    // catchError(err);
    throw err;
  }
}

async function getFilesByKey(key) {
  try {
    const fileRecord = await File.findAll({
      where: {
        s3Key: key,
      },
    });
    return fileRecord;
  } catch (error) {
    // catchError(error);
    console.log(error);
  }
}

const { Op } = require("sequelize");
const { sequelize } = require("../../models/index");

async function getFilesByCourseBatchId(
  courseBatchId,
  teamMemberId = null,
  teamId = null
) {
  const {
    File,
    FeedbackAnswer,
    Task,
    TaskGroup,
    Axis,
    AxisBatchArchives,
    User,
    TaskAssignment,
  } = require("../../models");

  let allowedTaskIds = null;
  let allowedTaskAssignmentIds = null;

  if (teamMemberId) {
    const taskAssignments = await TaskAssignment.findAll({
      where: { user_id: teamMemberId },
      attributes: ["id", "task_id"],
      raw: true,
    });
    allowedTaskIds = [...new Set(taskAssignments.map((ta) => ta.task_id))];
    allowedTaskAssignmentIds = taskAssignments.map((ta) => ta.id);
    if (allowedTaskIds.length === 0) return [];
  }

  if (teamId) {
    const rows = await sequelize.query(
      `SELECT DISTINCT t.id
       FROM "Tasks" t
       LEFT JOIN "TaskGroups" tg ON tg.id = t."taskGroupId"
       LEFT JOIN "Axes" a ON a.id = tg."axisId"
       LEFT JOIN "TaskAssignments" ta ON ta."task_id" = t.id
       LEFT JOIN "AxisBatchArchives" aba ON aba.axis_id = a.id
       WHERE aba."course_batch_id" = :courseBatchId
         AND (
           t."team_id" = :teamId
           OR tg."team_id" = :teamId
           OR a."team_id" = :teamId
           OR ta."team_id" = :teamId
         )
         AND t."deletedAt" IS NULL
         AND tg."deletedAt" IS NULL
         AND a."deletedAt" IS NULL`,
      {
        replacements: { courseBatchId, teamId },
        type: sequelize.QueryTypes.SELECT,
        raw: true,
      }
    );
    allowedTaskIds = (rows || []).map((r) => r.id);
    if (allowedTaskIds.length === 0) return [];
  }

  const includeOptions = [
    {
      model: Task,
      as: "task",
      required: true,
      ...(allowedTaskIds ? { where: { id: { [Op.in]: allowedTaskIds } } } : {}),
      include: [
        {
          model: TaskGroup,
          as: "TaskGroup",
          required: true,
          include: [
            {
              model: Axis,
              as: "Axis",
              required: true,
              include: [
                {
                  model: AxisBatchArchives,
                  as: "AxisBatchArchives",
                  required: true,
                  where: { course_batch_id: courseBatchId },
                  attributes: ["repository_kind"],
                },
                {
                  model: User,
                  as: "creator",
                  attributes: ["name", "username"],
                },
              ],
              attributes: ["id", "name", "color", "team_id"],
            },
          ],
          attributes: ["id", "name"],
        },
        {
          model: User,
          as: "User",
          attributes: ["name", "username"],
        },
      ],
      attributes: ["id", "name"],
    },
  ];

  const fileWhere = {};

  if (teamMemberId) {
    includeOptions.push({
      model: FeedbackAnswer,
      as: "feedbackAnswer",
      required: false,
      attributes: ["id", "is_viewable", "task_assignment_id", "team_member_id"],
      where: {
        is_viewable: true,
        [Op.or]: [
          { task_assignment_id: { [Op.in]: allowedTaskAssignmentIds } },
          { team_member_id: teamMemberId },
        ],
      },
    });

    fileWhere.isPatbass = false;

    const fileAccessConditions = [
      {
        feedback_answer_id: null,
        isFileResponse: { [Op.or]: [false, null] },
      },
      { "$feedbackAnswer.id$": { [Op.ne]: null } },
    ];

    if (allowedTaskAssignmentIds && allowedTaskAssignmentIds.length > 0) {
      fileAccessConditions.push({
        isFileResponse: true,
        task_assignment_id: { [Op.in]: allowedTaskAssignmentIds },
      });
    }

    fileWhere[Op.or] = fileAccessConditions;
  }

  const files = await File.findAll({
    where: fileWhere,
    include: includeOptions,
    order: [
      [
        { model: Task, as: "task" },
        { model: TaskGroup, as: "TaskGroup" },
        { model: Axis, as: "Axis" },
        "name",
        "ASC",
      ],
      [{ model: Task, as: "task" }, "name", "ASC"],
      ["createdAt", "DESC"],
    ],
  });

  return files;
}

async function canAccessFile(file, teamMemberId, teamId) {
  if (!file) return false;

  if (teamId) return true;

  if (!teamMemberId) return false;

  const {
    FeedbackAnswer,
    TaskAssignment,
    TeamMember,
    Task,
  } = require("../../models");

  // ✅ המרת TeamMember.id ל-User.id (למקרה ש-team_member_id במשוב מכיל User.id)
  const teamMember = await TeamMember.findByPk(teamMemberId);
  const userId = teamMember ? teamMember.user_id : null;

  // ---------- קבצי משוב ----------
  if (file.feedback_answer_id) {
    const feedbackAnswer = await FeedbackAnswer.findByPk(file.feedback_answer_id);
    if (!feedbackAnswer || !feedbackAnswer.is_viewable) return false;

    // שיוך ישיר לפי TeamMember.id
    if (feedbackAnswer.team_member_id && feedbackAnswer.team_member_id === teamMemberId) {
      return true;
    }

    // שיוך ישיר לפי User.id
    if (userId && feedbackAnswer.team_member_id && feedbackAnswer.team_member_id === userId) {
      return true;
    }

    // בדיקה דרך task_assignment_id
    if (feedbackAnswer.task_assignment_id) {
      const assignment = await TaskAssignment.findOne({
        where: { id: feedbackAnswer.task_assignment_id, user_id: teamMemberId },
      });
      if (assignment) return true;
    }

    // אם המשימה שייכת לצוות של החניך – מותר
    if (file.task_id) {
      const task = await Task.findByPk(file.task_id);
      if (task?.team_id) {
        const member = await TeamMember.findOne({
          where: { id: teamMemberId, team_id: task.team_id },
        });
        if (member) return true;
      }
    }

    return false;
  }

  // ---------- קבצי הגשה ----------
  if (file.isFileResponse) {
    const assignment = await TaskAssignment.findOne({
      where: { id: file.task_assignment_id, user_id: teamMemberId },
    });
    return !!assignment;
  }

  // ---------- קבצים רגילים של משימה ----------
  if (file.task_id) {
    const assignment = await TaskAssignment.findOne({
      where: { task_id: file.task_id, user_id: teamMemberId },
    });
    if (assignment) return true;

    const task = await Task.findByPk(file.task_id);
    if (task?.team_id) {
      const member = await TeamMember.findOne({
        where: { id: teamMemberId, team_id: task.team_id },
      });
      if (member) return true;
    }
  }

  return false;
}

async function canAccessCustomFolderFile(s3Key, teamMemberId, teamId) {
  const { CourseBatchFolderFile, CourseBatchFolder, TeamMember } = require("../../models");

  const folderFile = await CourseBatchFolderFile.findOne({
    where: { s3_key: s3Key },
  });
  if (!folderFile) return false;

  const folder = await CourseBatchFolder.findByPk(folderFile.folder_id);
  if (!folder) return false;

  // מצב צוות/מפקד – גישה לתיקיות הצוות
  if (teamId) {
    return folder.team_id && folder.team_id === teamId;
  }

  // מצב חניך
  if (teamMemberId) {
    // תיקייה אישית
    if (folder.team_member_id && folder.team_member_id === teamMemberId) return true;

    // תיקיית צוות – בדוק אם החניך שייך לאותו צוות
    if (folder.team_id) {
      const member = await TeamMember.findOne({
        where: { id: teamMemberId, team_id: folder.team_id },
      });
      return !!member;
    }
  }

  return false;
}

module.exports = {
  createFile,
  getFilesByTaskId,
  getFilesByKey,
  getFilesByFeedbackAnswerId,
  getFilesBySolutionFileId,
  getFilesByCourseBatchId,
  canAccessFile,
  canAccessCustomFolderFile,
};