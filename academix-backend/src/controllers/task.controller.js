const {
  Task,
  TaskAssignment,
  TaskTags,
  Tags,
  TaskGroup,
  Axis,
  TeamMember,
  Feedback,
  TaskBatchStatus,
  User,
  Form,
  FormSubmission,
  File,
  GradeStages,
  Team,
  CheckLists,
  FeedbackCategorySelection,
  FeedbackCategory ,
  TaskAssignmentHofef,
  TaskAssignmentOccurrence
} = require("../../models");
const { Op, where } = require("sequelize");
const { sequelize } = require("../../models/index");
const fileController = require("../controllers/file.controller");
const logger = require("../utils/logger");
const { catchError } = require("../utils/errorHandler");

exports.getAll = async (req, res) => {
  try {
    const tasks = await Task.findAll();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id, {
      include: [
        {
          model: Form,
          as: "parentForm",
          attributes: ["title", "id"],
        },
        {
          model: Form,
          as: "survey",
          attributes: ["title", "id"],
        },
        {
          model: Feedback,
          attributes: ["name", "id"],
        },
        {
          model: TaskAssignment,
          as: "taskAssignments",
          attributes: ["id", "assigned_by_user_id"],
          required: false,
          include: [
            {
              model: User,
              as: "assigner",
              attributes: ["id", "name"],
              required: false,
            },
          ],
        },
      ],
    });

    if (!task) return res.status(404).json({ error: "Task not found" });

    const assignerName = task.taskAssignments?.[0]?.assigner?.name || null;

    res.json({
      ...task.toJSON(),
      assignerName,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTasksByTaskGroupId = async (req, res) => {
  try {



    const taskGroupId = req.query.taskGroupId;
    const teamId = req.query.teamId ?? null;
    const selectedCourseBatch = req.query.selectedCourseBatch;

    const query = `
SELECT
    t.id,
    t.name,
    t.status,
    t.team_id,
    t."feedbackId" AS "feedbackId",
    t.color,
    t."recommendedTime",
    t."notRequiredToSubmit",
    CASE
        WHEN :teamId IS NULL THEN 0
        ELSE COUNT(DISTINCT ta.user_id)
    END AS assignedcount,
    CASE
        WHEN :teamId IS NULL THEN 0
        ELSE COALESCE(COUNT(DISTINCT tm.id),0)
    END AS totalmembers,
    CASE
        WHEN :teamId IS NULL                         THEN 0
        WHEN COUNT(DISTINCT tm.id) > 0               THEN
            ROUND(
                (COUNT(DISTINCT ta.user_id)::decimal /
                 COUNT(DISTINCT tm.id)) * 100,
                2)
        ELSE 0
    END AS completionrate,
    COALESCE(
        ARRAY_AGG(DISTINCT tm.user_id) FILTER (
            WHERE ta.completed IS NOT NULL
              AND ta.completed_at IS NOT NULL
              AND (:teamId IS NULL OR tm.team_id = :teamId)
        ),
        '{}'::int[]
    ) AS completed_all_tm_ids,
    COALESCE(
        ARRAY_AGG(DISTINCT tm.user_id) FILTER (
            WHERE ta.completed_at IS NOT NULL
               AND ta.completed IS NULL
              AND (:teamId IS NULL OR tm.team_id = :teamId)
        ),
        '{}'::int[]
    ) AS completed_at_only_tm_ids,
    COALESCE(
        ARRAY_AGG(DISTINCT tm.user_id) FILTER (
            WHERE ta.completed IS NOT NULL
              AND ta.completed_at IS NULL
              AND (:teamId IS NULL OR tm.team_id = :teamId)
        ),
        '{}'::int[]
    ) AS completed_only_tm_ids,
  
    BOOL_OR(ta."isQueueTask") AS has_queue_task,

    COUNT(DISTINCT ta.id) FILTER (WHERE ta."isQueueTask" = false OR ta."isQueueTask" IS NULL) AS regular_assignments_count,

    COUNT(DISTINCT ta.id) FILTER (WHERE ta."isQueueTask" = true) AS queue_assignments_count
FROM "Tasks" t
LEFT JOIN "TaskGroups" tg ON tg.id = t."taskGroupId"
                         AND tg."deletedAt" IS NULL  
LEFT JOIN "Axes" a ON a.id = tg."axisId"
                  AND a."deletedAt" IS NULL  
LEFT JOIN "Courses" c ON c.id = a."courseId"
LEFT JOIN "CourseBatches" cb ON cb."courseId" = c.id
LEFT JOIN "Teams" teams ON teams."courseId" = c.id
LEFT JOIN "TeamMembers" tm ON tm."team_id" = teams.id
                               AND tm."member_role" = 'STUDENT' 
                               AND tm."course_batch_id" = :selectedCourseBatch
LEFT JOIN "TaskAssignments" ta ON ta."task_id" = t.id
                               AND ta."user_id" = tm.id
WHERE t."taskGroupId" = :taskGroupId
  AND t."deletedAt" IS NULL  
  AND (:teamId IS NULL OR t.team_id = :teamId OR t.team_id IS NULL)
  AND (:teamId IS NULL OR teams.id = :teamId)
GROUP BY
    t.id,
    t.name,
    t.status,
    t.team_id,
    t.color,
    t."feedbackId"
ORDER BY
    t.id;
    `;

    const results = await sequelize.query(query, {
      replacements: {
        taskGroupId: taskGroupId,
        teamId: teamId,
        selectedCourseBatch: selectedCourseBatch,
      },
      type: sequelize.QueryTypes.SELECT,
      raw: true,
    });

    const taskBS = await TaskBatchStatus.findAll();
    const { operational, assignmentBank, archives } = results.reduce(
      (acc, task) => {
        const matchingTask = taskBS.find(
          (tbs) =>
            tbs.course_batch_id == selectedCourseBatch && tbs.taskId == task.id
        );
        if (matchingTask) {
          switch (matchingTask.status) {
            case "operational":
              acc.operational.push(task);
              break;
            case "assignment_bank":
              acc.assignmentBank.push(task);
              break;
            case "archives":
              acc.archives.push(task);
              break;
          }
        }
        return acc;
      },
      { operational: [], assignmentBank: [], archives: [] }
    );


    res.status(200).json({
      success: true,
      data: {
        operational,
        assignmentBank,
        archives,
      },
    });
  } catch (error) {
    catchError(error, req, res);
  }
};

exports.getUsersAssignedToTask = async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const teamId = req.query.teamId;

    if (!taskId) {
      return res.status(400).json({ error: "Task ID is required" });
    }
    if (!teamId) {
      return res.status(400).json({ error: "Team ID is required" });
    }

    const users = await TaskAssignment.findAll({
      where: { task_id: taskId, team_id: teamId },
      include: [
        {
          model: Task,
          attributes: ["id", "name"],
        },
        {
          model: TeamMember,
          as: "TeamMember",
          attributes: ["id", "user_id"],
          include: [
            {
              model: User,
              attributes: ["username", "name"],
            },
          ],
        },
      ],
    });
    const formatDate = (date) => {
      if (!date) return null;
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };

    const result = users.map((assignment) => ({
      taskId: assignment.Task.id,
      taskName: assignment.Task.name,
      userId: assignment.TeamMember.user_id,
      username: assignment.TeamMember.User.username,
      name: assignment.TeamMember.User.name,
      start: formatDate(assignment.start),
    }));

    res.json(result);
  } catch (error) {
    catchError(error, req, res);
  }
};
exports.getTasksByTaskGroupIdAndUser = async (req, res) => {
  try {
    const taskGroupId = req.query.taskGroupId;
    const selectedOption = req.query.selectedOption ?? null;
    const teamId = req.query.teamId ?? null;
    const userId = req.query.userId ?? null;
    const selectedCourseBatch = req.query.selectedCourseBatch;
    const permission = req.headers.selectedpermission;

    const ROLES = [
      "COURSE_COMMANDER",
      "DEVELOPER",
      "DOMAIN_MANAGER",
      "OVERLAP",
      "SYSTEM-ADMIN",
      "TEAM_COMMANDER",
    ];

    const hasSpecialPermission =
      permission &&
      typeof permission === "string" &&
      ROLES.includes(permission);

    const teamCourseBatchQuery = `
      SELECT is_block_color_enabled
      FROM "TeamCourseBatches"
      WHERE team_id = :teamId
        AND course_batch_id = :userCourseBatchId
    `;
    const teamCourseBatchResult = await sequelize.query(teamCourseBatchQuery, {
      replacements: { teamId, userCourseBatchId: selectedCourseBatch },
      type: sequelize.QueryTypes.SELECT,
      raw: true,
    });
    const isBlockColorEnabled =
      teamCourseBatchResult[0]?.is_block_color_enabled ?? false;

    const colorSelect = `
      CASE 
        WHEN :hasSpecialPermission THEN T.COLOR
        WHEN T.STATUS = 'assignment_bank' THEN T.COLOR
        WHEN :isBlockColorEnabled = false THEN T.COLOR
        ELSE NULL
      END AS COLOR,
    `;

    const userCourseBatchId = selectedCourseBatch;
    let blockDateFilter = "";
    let studentAssignmentFilter = "";
    if (!hasSpecialPermission) {
      blockDateFilter = `
        AND (
          t.status = 'assignment_bank'
          OR tcb."blockFromDate" IS NULL 
          OR tcb."blockToDate" IS NULL
          OR ta."start" < tcb."blockFromDate" 
          OR ta."start" > tcb."blockToDate"
        )
      `;
    }

    if (permission === "STUDENT" && selectedOption !== "assignment_bank") {
      studentAssignmentFilter = `AND ta.id IS NOT NULL`;
    }

    const query = `
      SELECT 
          T.ID,
          T.NAME,
          T.STATUS,
          T.TEAM_ID,
          ${colorSelect}
          T."recommendedTime",
          T."notRequiredToSubmit",
          T."formId",
          T."feedbackId" AS "feedbackId", 
          TA.COMPLETED,
          TA.COMPLETED_AT,
          ta."start" AS ASSIGNED,
          ta."isQueueTask" AS "has_queue_task",
          ta."end" AS END_DATE,
          TA.ID AS TASK_ASSIGNMENT_ID
      FROM "Tasks" t
      LEFT JOIN "TaskGroups" tg ON tg.id = t."taskGroupId"
                               AND tg."deletedAt" IS NULL
      LEFT JOIN "Axes" a ON a.id = tg."axisId"
                        AND a."deletedAt" IS NULL
      LEFT JOIN "Courses" c ON c.id = a."courseId"
      LEFT JOIN "CourseBatches" cb ON cb."courseId" = c.id AND cb.id = :userCourseBatchId 
      LEFT JOIN "TeamCourseBatches" tcb 
          ON tcb.course_batch_id = :userCourseBatchId
          AND tcb.team_id = :teamId
      LEFT JOIN "TaskAssignments" ta 
          ON ta."task_id" = t.id 
          AND ta."user_id" = :userId
          AND ta."team_id" = :teamId
      WHERE t."taskGroupId" = :taskGroupId 
        AND t."deletedAt" IS NULL
        AND (t.team_id = :teamId OR t.team_id IS NULL)
        ${blockDateFilter}
        ${studentAssignmentFilter}
      ORDER BY t.id, ta."start" ASC;
    `;
    const results = await sequelize.query(query, {
      replacements: {
        taskGroupId,
        teamId,
        userId,
        userCourseBatchId,
        hasSpecialPermission,
        isBlockColorEnabled,
      },
      type: sequelize.QueryTypes.SELECT,
      raw: true,
    });



    // ==========================================
    // 1. קיבוץ משימות + כל השיבוצים
    // ==========================================
    const taskMap = new Map();

    results.forEach((row) => {
      const taskId = row.id;

      if (!taskMap.has(taskId)) {
        taskMap.set(taskId, {
          id: taskId,
          name: row.name,
          status: row.status,
          team_id: row.team_id,
          color: row.color,
          recommendedTime: row.recommendedTime,
          notRequiredToSubmit: row.notRequiredToSubmit,
          formId: row.formId,
          feedbackId: row.feedbackId,
          task_assignment_id: null,
          completed: null,
          completed_at: null,
          assigned: null,
          end_date: null,
          allAssignments: [],
          has_queue_task: row?.has_queue_task
        });
      }

      // הוסף שיבוץ למשימה
      if (row.task_assignment_id) {
        taskMap.get(taskId).allAssignments.push({
          task_assignment_id: row.task_assignment_id,
          completed: row.completed,
          completed_at: row.completed_at,
          assigned: row.assigned,
          end_date: row.end_date,
          has_queue_task: row?.has_queue_task
        });

        // אם זה השיבוץ הראשון, שמור אותו גם ברמת המשימה
        const task = taskMap.get(taskId);
        if (!task.task_assignment_id) {
          task.task_assignment_id = row.task_assignment_id;
          task.completed = row.completed;
          task.completed_at = row.completed_at;
          task.assigned = row.assigned;
          task.end_date = row.end_date;
        }
      }
    });

    const tasksArray = Array.from(taskMap.values());

    // ==========================================
    // 2. הוסף metadata על המשימה
    // ==========================================
    tasksArray.forEach((task) => {
      task.assignmentCount = task.allAssignments.length;
      task.hasMultipleAssignments = task.allAssignments.length > 1;
    });

    // ==========================================
    // 3. איסוף IDs לשליפות
    // ==========================================
    const allTaskAssignmentIds = [];
    const taskFormIds = [];

    tasksArray.forEach((task) => {
      if (task.formId) {
        taskFormIds.push(task.formId);
      }
      task.allAssignments.forEach((assignment) => {
        if (assignment.task_assignment_id) {
          allTaskAssignmentIds.push(assignment.task_assignment_id);
        }
      });
    });

    // ==========================================
    // 4. שליפת נקודות מקסימום לטפסים
    // ==========================================
    let formQuestionsMap = new Map();
    if (taskFormIds.length > 0) {
      const formQuestions = await sequelize.query(
        `SELECT form_id, SUM(points) as max_score
         FROM "FormQuestions"
         WHERE form_id IN (:formIds)
         GROUP BY form_id`,
        {
          replacements: { formIds: taskFormIds },
          type: sequelize.QueryTypes.SELECT,
          raw: true,
        }
      );
      formQuestions.forEach((fq) => {
        formQuestionsMap.set(fq.form_id, parseInt(fq.max_score) || 0);
      });
    }

    // ==========================================
    // 5. שליפת submissions
    // ==========================================
    let formSubmissionsMap = new Map();
    if (allTaskAssignmentIds.length > 0) {
      const formSubmissions = await sequelize.query(
        `SELECT DISTINCT ON ("task_assignment_id") 
           "task_assignment_id", score, submitted_at, started_at
         FROM "FormSubmissions"
         WHERE "task_assignment_id" IN (:taskAssignmentIds)
         ORDER BY "task_assignment_id", submitted_at DESC`,
        {
          replacements: { taskAssignmentIds: allTaskAssignmentIds },
          type: sequelize.QueryTypes.SELECT,
          raw: true,
        }
      );
      formSubmissions.forEach((fs) => {
        formSubmissionsMap.set(fs.taskAssignmentId, fs);
      });
    }

    // ==========================================
    // 6. עדכון משימות ושיבוצים עם נתוני טופס
    // ==========================================
    tasksArray.forEach((task) => {
      const maxScore = formQuestionsMap.get(task.formId) || 0;
      task.max_score = maxScore;

      // עדכון המשימה הראשית
      const submission = formSubmissionsMap.get(task.task_assignment_id);
      task.form_score = submission?.score || null;
      task.form_completed_at = submission?.submitted_at || null;
      task.form_started_at = submission?.started_at || null;
      task.scorePercentage =
        task.form_score && maxScore > 0
          ? Number(((task.form_score / maxScore) * 100).toFixed(2))
          : null;

      // עדכון כל שיבוץ
      task.allAssignments.forEach((assignment) => {
        const assignmentSubmission = formSubmissionsMap.get(assignment.task_assignment_id);
        assignment.form_score = assignmentSubmission?.score || null;
        assignment.form_completed_at = assignmentSubmission?.submitted_at || null;
        assignment.form_started_at = assignmentSubmission?.started_at || null;
        assignment.max_score = maxScore;
        assignment.scorePercentage =
          assignment.form_score && maxScore > 0
            ? Number(((assignment.form_score / maxScore) * 100).toFixed(2))
            : null;
      });
    });

    // ==========================================
    // 7. חלוקה לפי סטטוס
    // ==========================================
    const taskBS = await TaskBatchStatus.findAll();
    const statusMap = new Map();
    taskBS.forEach((tbs) => {
      const key = `${tbs.taskId}-${tbs.course_batch_id}`;
      statusMap.set(key, tbs.status);
    });

    const { operational, assignmentBank, archives } = tasksArray.reduce(
      (acc, task) => {
        const status = statusMap.get(`${task.id}-${userCourseBatchId}`);
        if (status === "operational") acc.operational.push(task);
        else if (status === "assignment_bank") acc.assignmentBank.push(task);
        else if (status === "archives") acc.archives.push(task);
        else acc.operational.push(task);
        return acc;
      },
      { operational: [], assignmentBank: [], archives: [] }
    );

    res.status(200).json({
      success: true,
      data: { operational, assignmentBank, archives },
    });
  } catch (error) {
    catchError(error, req, res);
  }
};
exports.create = async (req, res) => {
  const { selectedCourseBatch } = req.params;
  try {
    const taskData = { ...req.body };

    // 🔽 אם אין team_id על המשימה – נשלים מה-TaskGroup או מה-Axis
    if (!taskData.team_id) {
      const taskGroup = await TaskGroup.findByPk(taskData.taskGroupId);
      if (taskGroup) {
        if (taskGroup.team_id) {
          taskData.team_id = taskGroup.team_id;
        } else {
          const axis = await Axis.findByPk(taskGroup.axisId);
          if (axis?.team_id) {
            taskData.team_id = axis.team_id;
          }
        }
      }
    }

    const newTask = await Task.create(taskData);

    const tasks = await Task.findAll({
      where: { id: newTask.id },
    });

    let taskBatchStatuses = [];
    for (const task of tasks) {
      taskBatchStatuses.push({
        taskId: task.id,
        course_batch_id: selectedCourseBatch,
        status: task.status,
      });
    }

    if (taskBatchStatuses.length > 0) {
      await TaskBatchStatus.bulkCreate(taskBatchStatuses);
    }

    logger.info("Task created", {
      taskId: newTask.id,
      taskName: newTask.name,
      courseBatchId: selectedCourseBatch,
      userId: req.headers["x-user-id"],
    });

    res.status(201).json(newTask);
  } catch (err) {
    logger.error("Failed to create task", {
      error: err.message,
      courseBatchId: selectedCourseBatch,
      userId: req.headers["x-user-id"],
    });
    catchError(err, req, res);
  }
};
// ============================================
// פונקציה לשכפול משימה עם כל הטבלאות הקשורות
// ============================================
const replicateTaskWithRelations = async (prevTaskId, newTask, transaction) => {
  const replicatedIds = {
    checkLists: [],
    files: [],
    taskTags: [],
  };

  // 1. שכפול CheckLists
  const checkLists = await CheckLists.findAll({
    where: { task_id: prevTaskId },
    transaction,
  });

  for (const item of checkLists) {
    const newItem = await CheckLists.create(
      { task_id: newTask.id, todo: item.todo },
      { transaction }
    );
    replicatedIds.checkLists.push(newItem.id);
  }

  // 2. שכפול Files (עם task_id)
  const files = await File.findAll({
    where: { task_id: prevTaskId },
    transaction,
  });

  for (const file of files) {
    const newFile = await File.create(
      {
        task_id: newTask.id,
        s3BucketName: file.s3BucketName,
        name: file.name,
        size: file.size,
        length: file.length,
        type: file.type,
        s3Key: file.s3Key,
        isPatbass: file.isPatbass,
      },
      { transaction }
    );
    replicatedIds.files.push(newFile.id);
  }

  // 3.5. שכפול CheckLists
  const TaskTagsList = await TaskTags.findAll({
    where: { task_id: prevTaskId },
    transaction,
  });

  for (const item of TaskTagsList) {
    const newItem = await TaskTags.create(
      { task_id: newTask.id, tag_id: item.tag_id },
      { transaction }
    );
    replicatedIds.taskTags.push(newItem.id);
  }

  return replicatedIds;
};
exports.update = async (req, res) => {
  const batchId = req.body.batchId || req.body.courseBatchId;
  const t = await sequelize.transaction();

  try {
    const originalTask = await Task.findByPk(req.params.id, {
      attributes: ["team_id"],
      transaction: t,
    });

    const { team_id, ...updateData } = req.body;
    const finalUpdateData =
      originalTask.team_id === null
        ? updateData // שמור על team_id המקורי (NULL)
        : req.body; // עדכן הכל כולל team_id

    // ✅ בדיקה: כמה פעמים ה-taskId מופיע בטבלת TaskBatchStatus
    const existingStatuses = await TaskBatchStatus.findAll({
      where: { taskId: req.params.id },
    });
    const countInStatus = existingStatuses.length;

    if (countInStatus === 1) {
      const [updated] = await Task.update(finalUpdateData, {
        // 👈 שונה
        where: { id: req.params.id },
        individualHooks: true,
        batchId: batchId,
        transaction: t,
      });
      await TaskBatchStatus.update(
        { status: req.body.status },
        {
          where: {
            taskId: req.params.id,
            course_batch_id: batchId,
          },
          transaction: t,
        }
      );
      await t.commit();
      const updatedTask = await Task.findByPk(req.params.id);
      logger.info("Task updated", {
        taskId: req.params.id,
        updatedFields: Object.keys(req.body),
        userId: req.headers["x-user-id"],
      });

      return res.json(updatedTask);
    } else if (countInStatus > 1) {
      await Task.update(
        { is_active: false },
        { where: { id: req.params.id }, transaction: t }
      );

      const prevTask = await Task.findOne({
        where: { id: req.params.id },
        transaction: t,
      });

      const newTaskData = {
        ...finalUpdateData, // 👈 שונה
        taskGroupId: prevTask.taskGroupId,
      };

      const newTask = await Task.create(newTaskData, { transaction: t });

      await TaskBatchStatus.update(
        { taskId: newTask.id },
        {
          where: {
            taskId: req.params.id,
            course_batch_id: batchId,
          },
          transaction: t,
        }
      );

      await t.commit();
      const updatedTask = await Task.findByPk(newTask.id);
      logger.info("New task created from existing task", {
        oldTaskId: req.params.id,
        newTaskId: newTask.id,
        courseBatchId: batchId,
        userId: req.headers["x-user-id"],
      });

      return res.json({
        ...updatedTask,
        message: `נוצרה משימה חדשה (ID: ${newTask.id}) והמשימה הישנה (ID: ${req.params.id}) הושבתה`,
      });
    }
  } catch (err) {
    logger.error("Failed to update task", {
      taskId: req.params.id,
      error: err.message,
      userId: req.headers["x-user-id"],
    });

    await t.rollback();
    console.log(err);
    res.status(400).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  const taskId = req.params.id;
  const t = await sequelize.transaction();  // ← כאן נוצר המשתנה t!

  try {
    const reletedFiles = await File.findAll({
      where: { task_id: taskId },
      transaction: t,
    });

    if (reletedFiles && reletedFiles?.length > 0) {
      for (const f of reletedFiles) {
        await fileController.deleteFile(f?.id);
      }
      logger.info("Task files deleted", {
        taskId,
        filesCount: reletedFiles.length,
        userId: req.headers["x-user-id"],
      });
    }

    // soft delete לכל ההקצאות של המשימה
    await TaskAssignment.destroy({
      where: { task_id: taskId },
      transaction: t,
    });

    // מקבלים את כל ההקצאות (כולל אלה שנמחקו רך זה עתה)
    const assignments = await TaskAssignment.findAll({
      where: { task_id: taskId },
      paranoid: false, 
      transaction: t,
    });

    const assignmentIds = assignments.map((a) => a.id);

    if (assignmentIds.length > 0) {
      await TaskAssignmentOccurrence.destroy({
        where: { task_assignment_id: assignmentIds },
        transaction: t,
      });
      await TaskAssignmentHofef.destroy({
        where: { task_assignment_id: assignmentIds },
        transaction: t,
      });
    }

    // המשימה עצמה (soft delete) — עם אותו transaction
    const deleted = await Task.destroy({
      where: { id: taskId },
      transaction: t,
    });

    if (!deleted) {
      await t.rollback();
      logger.warn("Task not found for deletion", {
        taskId,
        userId: req.headers["x-user-id"],
      });
      return res.status(404).json({ error: "Task not found" });
    }

    await t.commit();

    logger.info("Task deleted", {
      taskId,
      userId: req.headers["x-user-id"],
    });

    res.json({ message: "Task deleted" });
  } catch (err) {
    await t.rollback();
    logger.error("Failed to delete task", {
      taskId,
      error: err.message,
      userId: req.headers["x-user-id"],
    });
    res.status(500).json({ error: err.message });
  }
};

exports.getTasksWithFeedbackByTeamId = async (req, res) => {
  try {
    const { teamId, courseBatchId } = req.params;
    const { dateFilter } = req.query;

    if (!teamId || !courseBatchId) {
      return res.status(400).json({ error: "Team ID and Course Batch ID are required" });
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    let dateCondition = {};

    if (dateFilter === "0") {
      dateCondition = {
        start: {
          [Op.gte]: startOfToday,
          [Op.lt]: endOfToday,
        },
      };
    } else if (dateFilter === "1") {
      dateCondition = {
        start: {
          [Op.gte]: startOfWeek,
        },
      };
    } else if (dateFilter === "2") {
      dateCondition = {
        start: {
          [Op.gt]: endOfToday,
        },
      };
    }

    const whereClause = { team_id: teamId };

    if (dateFilter && dateFilter !== "all" && dateFilter !== "4") {
      Object.assign(whereClause, dateCondition);
    }

    const taskAssignments = await TaskAssignment.findAll({
      where: whereClause,
      include: [
        {
          model: TeamMember,
          as: "TeamMember",
          attributes: ["id"],
          where: { course_batch_id: courseBatchId },
          required: true,
        },
        {
          model: Task,
          attributes: ["id", "name", "description", "createdAt", "feedbackId"],
          include: [{ model: Feedback, as: "Feedback" }],
          where: { feedbackId: { [Op.not]: null } },
          required: true,
        },
      ],
    });

    const taskMap = new Map();

    taskAssignments.forEach((assignment) => {
      const task = assignment.Task;
      const feedback = task ? task.Feedback : null;
      const teamMemberId = assignment.TeamMember?.id;
      const key = `${task.id}-${assignment.start}-${assignment.end}`;

      if (!taskMap.has(key)) {
        taskMap.set(key, {
          taskId: task.id,
          taskName: task.name,
          taskDescription: task.description,
          taskCreatedAt: task.createdAt,
          start: assignment.start,
          end: assignment.end,
          teamMemberId: teamMemberId,
          feedback: feedback
            ? {
                id: feedback.id,
                name: feedback.name,
                categories: [],
              }
            : null,
          countOfAssignments: 0,
          countOfAnswers: 0,
          assignments: [],
        });
      }

      taskMap.get(key).countOfAssignments += 1;
      taskMap.get(key).assignments.push({
        id: assignment.id,
        start: assignment.start,
        end: assignment.end,
        status: assignment.status,
        createdAt: assignment.createdAt,
      });
    });

    const tasksWithAnswers = Array.from(taskMap.values());

    for (const taskData of tasksWithAnswers) {
      if (taskData.feedback && taskData.feedback.id) {
        const assignmentIds = taskData.assignments.map(a => a.id);

        if (assignmentIds.length > 0) {
          // ספירת תשובות קיימות
          const countQuery = `
            SELECT COUNT(*) as count
            FROM "FeedbackAnswers" fa
            WHERE fa."task_assignment_id" IN (:assignmentIds)
              AND fa."feedback_id" = :feedbackId
          `;

          const countResult = await sequelize.query(countQuery, {
            replacements: {
              assignmentIds,
              feedbackId: taskData.feedback.id,
            },
            type: sequelize.QueryTypes.SELECT,
          });

          taskData.countOfAnswers = countResult[0].count || 0;

          // שליפת כל הקטגוריות שנבחרו במשובים של אותה משימה
          const categorySelections = await FeedbackCategorySelection.findAll({
            where: {
              task_assignment_id: { [Op.in]: assignmentIds },
              feedback_id: taskData.feedback.id,
              selection_type: {
                [Op.in]: ["improvement", "preservation"],
              },
            },
            include: [
              {
                model: FeedbackCategory,
                as: "category",
                attributes: ["id", "category"],
                required: true,
              },
            ],
            raw: true, // כדי לקבל אובייקטים פשוטים
          });

          // איסוף כל הקטגוריות למפה לפי categoryId
          const categoriesMap = new Map();

          categorySelections.forEach((selection) => {
            const type = selection.selection_type; // "improvement" או "preservation"
            const categoryId = selection["category.id"];
            const categoryName = selection["category.category"];

            if (!categoriesMap.has(categoryId)) {
              categoriesMap.set(categoryId, {
                categoryId: categoryId,
                categoryName: categoryName,
                counts: {
                  improvement: 0,
                  preservation: 0,
                },
              });
            }

            const categoryData = categoriesMap.get(categoryId);
            if (type === "improvement") {
              categoryData.counts.improvement += 1;
            } else if (type === "preservation") {
              categoryData.counts.preservation += 1;
            }
          });

          // הכנסת הקטגוריות לפידבק של המשימה
          taskData.feedback.categories = Array.from(categoriesMap.values());
        }
      }
    }

    res.json(tasksWithAnswers);
  } catch (error) {
    catchError(error, req, res);
  }
};
exports.getTasksByGradeStageId = async (req, res) => {
  try {
    const gradeStageIds = req.headers.gradestageids;
    const query = `
    SELECT jsonb_strip_nulls(to_jsonb(forms)) AS data,
           tg.name AS taskGroupName
    FROM public."Tasks" as forms 
    LEFT JOIN public."TaskGroups" tg ON forms."taskGroupId" = tg.id
    WHERE "gradeStageId" IN (:gradeStageIds) 
    AND forms.status = 'operational'
`;

    const results = await sequelize.query(query, {
      replacements: {
        gradeStageIds: gradeStageIds
          ?.split(",")
          .map((id) => parseInt(id.trim())),
      },
      type: sequelize.QueryTypes.SELECT,
      raw: true,
    });



    if (!results || results.length === 0) {
      res.status(200).json({
        success: true,
        data: [],
      });
      return;
    }



    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    catchError(error, req, res);
  }
};

exports.getTasksByUser = async (req, res) => {
  const { teamId, userId, courseBatchId } = req.query;
  const skipVisibility = req.query.skipVisibility === "true";
  const permission = req.headers.selectedpermission;
  const ROLES = [
    "COURSE_COMMANDER",
    "DEVELOPER",
    "DOMAIN_MANAGER",
    "OVERLAP",
    "SYSTEM-ADMIN",
    "TEAM_COMMANDER",
  ];
  const hasSpecialPermission =
    permission && typeof permission === "string" && ROLES.includes(permission);
  const teamMember = await TeamMember.findOne({
    where: {
      user_id: userId,
      team_id: teamId,
      course_batch_id: courseBatchId,
    },
  });


  if (!teamMember) {
    return res.json([]);
  }
  if (courseBatchId && parseInt(courseBatchId) !== teamMember.course_batch_id) {
    return res
      .status(403)
      .json({ error: "Invalid course batch for this team member" });
  }
  const effectiveCourseBatchId = courseBatchId || teamMember.course_batch_id;
  const teamMemberId = teamMember.id;
  const teamCourseBatchQuery = `
    SELECT is_block_color_enabled
    FROM "TeamCourseBatches"
    WHERE team_id = :teamId
      AND course_batch_id = :effectiveCourseBatchId
  `;
  const teamCourseBatchResult = await sequelize.query(teamCourseBatchQuery, {
    replacements: { teamId, effectiveCourseBatchId },
    type: sequelize.QueryTypes.SELECT,
    raw: true,
  });
  const isBlockColorEnabled =
    teamCourseBatchResult[0]?.is_block_color_enabled ?? false;
  const calculateDelay = (date1, date2) => {
    if (!date1 || !date2) return null;
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffMs = d1.getTime() - d2.getTime();
    if (diffMs > 0) {
      const absDiff = Math.abs(diffMs);
      const hours = Math.floor(absDiff / (1000 * 60 * 60));
      const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
      const days = Math.floor(hours / 24);
      return {
        days: days > 0 ? days : null,
        hours: days > 0 ? hours % 24 : hours,
        minutes: hours === 0 ? minutes : null,
        isLate: true,
        totalMinutes: Math.floor(absDiff / (1000 * 60)),
      };
    }
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const days = Math.floor(hours / 24);
    return {
      days: days > 0 ? days : null,
      hours: days > 0 ? hours % 24 : hours,
      minutes: hours === 0 ? minutes : null,
      isLate: false,
      totalMinutes: Math.floor(diffMs / (1000 * 60)),
    };
  };
  const calculateTimeSinceEnd = (endDate) => {
    if (!endDate) return { days: null, hours: null };
    const end = new Date(endDate);
    const now = new Date();
    const timeDiff = now.getTime() - end.getTime();
    if (timeDiff < 0) {
      return { days: null, hours: null };
    }
    const totalHours = Math.floor(timeDiff / (1000 * 60 * 60));
    if (totalHours < 24) {
      return { days: null, hours: totalHours > 0 ? totalHours + 2 : null };
    }
    const days = Math.floor(totalHours / 24);
    return {
      days: days > 0 ? days : null,
      hours: null,
    };
  };
  try {
    // Extract period from request query or body
    const startFilter = req.query.startFilter;
    const endFilter = req.query.endFilter;




    let blockDateFilter = "";
    if (!hasSpecialPermission) {
      blockDateFilter = `
      AND (
        t.status = 'assignment_bank'
        OR tcb."blockFromDate" IS NULL
        OR tcb."blockToDate" IS NULL
        OR ta.start < tcb."blockFromDate"
        OR ta.start > tcb."blockToDate"
      )
    `;
    }



    const blockDateFilterDirect = blockDateFilter;

    const blockDateFilterOccurrences = blockDateFilter
      .replace(/ta\.start/g, "COALESCE(tao.start, ta.start)")
      .replace(/ta\.end/g, "COALESCE(tao.end, ta.end)");

    const sql = `
  WITH visibility_settings AS (
    SELECT
      task_id,
      start_minutes_before,
      end_minutes_after
    FROM "TaskVisibilityOverrides"
    WHERE team_id = :teamId
  )
  -- משימות ישירות מ-TaskAssignments
  SELECT
    ta.id,
    ta.id AS "task_assignment_id",
    ta."start",
    ta."end",
    ta.completed,
    ta."completed_at",
    ta.task_id,
    ta.team_id,
    t."formId" AS "formId",
    t."exposure",
    t."notRequiredToSubmit",
    t.status AS task_status,
    t.name AS "taskName",
    t.id AS "taskId",
    t."recommendedTime" AS "taskRecommendedTime",
    tg.name AS "taskGroupName",
    a.color AS "axisColor",
    COALESCE(v.start_minutes_before, 0) AS start_minutes_before,
    COALESCE(v.end_minutes_after, 0) AS end_minutes_after,
    0 AS "isOccurrence"
  FROM "TaskAssignments" ta
  JOIN "Tasks" t ON t.id = ta."task_id"
  LEFT JOIN "TaskGroups" tg ON tg.id = t."taskGroupId"
  LEFT JOIN "Axes" a ON a.id = tg."axisId"
  LEFT JOIN visibility_settings v ON v.task_id = t.id
  LEFT JOIN "TeamCourseBatches" tcb
    ON tcb.team_id = ta.team_id
    AND tcb.course_batch_id = :courseBatchId
  WHERE ta."user_id" = :teamMemberId
    AND ta."team_id" = :teamId
    AND ta."start" > :startFilter
    AND ta."end" < :endFilter
    ${blockDateFilterDirect}
  UNION ALL
  -- משימות מ-TaskAssignmentOccurrences
  SELECT
    tao.id,
    tao.id AS "task_assignment_id",
    COALESCE(tao.start, ta."start") AS "start",
    COALESCE(tao.end, ta."end") AS "end",
    ta.completed,
    ta."completed_at",
    ta.task_id,
    ta.team_id,
    t."formId" AS "formId",
    t."exposure",
    t."notRequiredToSubmit",
    t.status AS task_status,
    t.name AS "taskName",
    t.id AS "taskId",
    t."recommendedTime" AS "taskRecommendedTime",
    tg.name AS "taskGroupName",
    a.color AS "axisColor",
    COALESCE(v.start_minutes_before, 0) AS start_minutes_before,
    COALESCE(v.end_minutes_after, 0) AS end_minutes_after,
    1 AS "isOccurrence"
  FROM "TaskAssignmentOccurrences" tao
  JOIN "TaskAssignments" ta ON ta.id = tao.task_assignment_id
  JOIN "Tasks" t ON t.id = ta."task_id"
  LEFT JOIN "TaskGroups" tg ON tg.id = t."taskGroupId"
  LEFT JOIN "Axes" a ON a.id = tg."axisId"
  LEFT JOIN visibility_settings v ON v.task_id = t.id
  LEFT JOIN "TeamCourseBatches" tcb
    ON tcb.team_id = ta.team_id
    AND tcb.course_batch_id = :courseBatchId
  WHERE ta."user_id" = :teamMemberId
    AND ta."team_id" = :teamId
    AND COALESCE(tao.start, ta.start) > :startFilter
    AND COALESCE(tao.end, ta.end) < :endFilter
    ${blockDateFilterOccurrences}
  ORDER BY "start" ASC;
`;

    const results = await sequelize.query(sql, {
      replacements: {
        teamMemberId: teamMemberId,
        teamId: teamId,
        courseBatchId: effectiveCourseBatchId,
        startFilter: startFilter || new Date("1/1/1970"), endFilter: endFilter || new Date("1/1/2027")
      },
      type: sequelize.QueryTypes.SELECT,
      raw: true,
    });




    const now = new Date();
    
    
    const filteredResults = results
      .filter((row) => {
        const start = new Date(row.start);
        const end = new Date(row.end);
        const startMinutesBefore = row.start_minutes_before || 0;
        const endMinutesAfter = row.end_minutes_after || 0;
        if (skipVisibility) {
          return true;
        }
        if (startMinutesBefore === 0 && endMinutesAfter === 0) {
          return true;
        }
        const visibleFrom = new Date(
          start.getTime() - startMinutesBefore * 60 * 1000
        );
        const visibleUntil = new Date(
          end.getTime() + endMinutesAfter * 60 * 1000
        );
        return now >= visibleFrom && now <= visibleUntil;
      })
      .map((row) => {
        const timeSinceEnd = calculateTimeSinceEnd(row.end);
        const currentDelay = !row.completed_at
          ? calculateDelay(now, row.end)
          : null;
        const submissionDelay = row.completed_at
          ? calculateDelay(row.completed_at, row.end)
          : null;
        const approvalTime =
          row.completed && row.completed_at
            ? calculateDelay(row.completed, row.completed_at)
            : null;
        const hasRecommendedTime = row.taskRecommendedTime != null;
        let exceededRecommendedTime = null;
        if (hasRecommendedTime && row.end) {
          const recommendedMinutes = parseInt(row.taskRecommendedTime, 10);
          const endDate = new Date(row.end);
          if (!row.completed_at) {
            const nowTime = new Date();
            const recommendedEndTime =
              endDate.getTime() + recommendedMinutes * 60 * 1000;
            const timeSinceRecommendedEnd =
              nowTime.getTime() - recommendedEndTime;
            if (timeSinceRecommendedEnd > 0) {
              const exceededMinutes = Math.floor(
                timeSinceRecommendedEnd / (1000 * 60)
              );
              exceededRecommendedTime = {
                minutes: exceededMinutes,
                isLate: true,
              };
            }
          } else if (row.completed_at && !row.completed) {
            const completedDate = new Date(row.completed);
            const recommendedEndTime =
              endDate.getTime() + recommendedMinutes * 60 * 1000;
            const timeSinceRecommendedEnd =
              completedDate.getTime() - recommendedEndTime;
            if (timeSinceRecommendedEnd > 0) {
              const exceededMinutes = Math.floor(
                timeSinceRecommendedEnd / (1000 * 60)
              );
              exceededRecommendedTime = {
                minutes: exceededMinutes,
                isLate: true,
              };
            }
          }
        }
        const isExposure = row.exposure === true;
        const start = new Date(row.start);
        const shouldShowColor =
          hasSpecialPermission ||
          row.task_status === "assignment_bank" ||
          !isBlockColorEnabled;

        const TaskObj = {
          name: row.taskName,
          id: row.taskId,
          recommendedTime: row.taskRecommendedTime,
          feedbackId: row.feedbackId,
          TaskGroup: {
            name: row.taskGroupName,
          },
        };
        if (shouldShowColor) {
          TaskObj.TaskGroup.Axis = {
            color: row.axisColor,
          };
        }
        return {
          ...row,
          Task: TaskObj,
          timeSinceEnd,
          currentDelay,
          submissionDelay,
          approvalTime,
          isLocked: isExposure && now < start,
          hasExposure: isExposure,
          exceededRecommendedTime,
          isOccurrence: row.isOccurrence === 1,
        };
      });
    const taskAssignmentIds = filteredResults
      .map((t) => t.task_assignment_id)
      .filter((id) => id);
    const taskFormIds = filteredResults
      .filter((t) => t.formId)
      .map((t) => t.formId);
    let formQuestionsMap = new Map();
    if (taskFormIds.length > 0) {
      const formQuestions = await sequelize.query(
        `
        SELECT form_id, SUM(points) as max_score
        FROM "FormQuestions"
        WHERE form_id IN (:formIds)
        GROUP BY form_id
      `,
        {
          replacements: { formIds: taskFormIds },
          type: sequelize.QueryTypes.SELECT,
          raw: true,
        }
      );
      formQuestions.forEach((fq) => {
        formQuestionsMap.set(fq.form_id, parseInt(fq.max_score) || 0);
      });
    }
    let formSubmissionsMap = new Map();
    if (taskAssignmentIds.length > 0) {
      const formSubmissions = await sequelize.query(
        `
        SELECT DISTINCT ON ("task_assignment_id")
          "task_assignment_id", score, submitted_at, started_at
        FROM "FormSubmissions"
        WHERE "task_assignment_id" IN (:taskAssignmentIds)
        ORDER BY "task_assignment_id", submitted_at DESC
      `,
        {
          replacements: { taskAssignmentIds },
          type: sequelize.QueryTypes.SELECT,
          raw: true,
        }
      );
      formSubmissions.forEach((fs) => {
        formSubmissionsMap.set(fs.task_assignment_id, fs);
      });
    }
    filteredResults.forEach((task) => {
      const formId = task.formId;
      const maxScore = formQuestionsMap.get(formId) || 0;
      const submission = formSubmissionsMap.get(task.task_assignment_id);
      task.form_score = submission?.score || null;
      task.form_completed_at = submission?.submitted_at || null;
      task.form_started_at = submission?.started_at || null;
      task.max_score = maxScore;
      task.scorePercentage =
        task.form_score && maxScore > 0
          ? Number(((task.form_score / maxScore) * 100).toFixed(2))
          : null;
    });

  

    
    res.json(filteredResults);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.getTasksBySemester = async (req, res) => {
  let teamIds = req.query.teamId || req.query["teamId[]"];
  const courseBatchId =
    req.query.selectedCourseBatch || req.query["selectedCourseBatch"];

  const calculateTimeSinceEnd = (endDate) => {
    if (!endDate) return { days: null, hours: null };
    const end = new Date(endDate);
    const now = new Date();
    const timeDiff = now.getTime() - end.getTime();
    if (timeDiff < 0) {
      return { days: null, hours: null };
    }
    const totalHours = Math.floor(timeDiff / (1000 * 60 * 60));
    if (totalHours < 24) {
      return { days: null, hours: totalHours > 0 ? totalHours + 2 : null };
    }
    const days = Math.floor(totalHours / 24);
    return {
      days: days > 0 ? days : null,
      hours: null,
    };
  };

  if (!teamIds) {
    return res.status(400).json({ error: 'Missing "teamIds" query parameter' });
  }
  if (!Array.isArray(teamIds)) {
    teamIds = [teamIds];
  }
  const numericIds = teamIds.map((id) => Number(id));
  if (numericIds.length === 0) {
    return res
      .status(400)
      .json({ error: "No valid numeric TeamIDs were provided" });
  }

  try {
    let userIdCondition = {};
    if (courseBatchId) {
      const teamMembers = await TeamMember.findAll({
        where: {
          team_id: { [Op.in]: numericIds },
          course_batch_id: Number(courseBatchId),
        },
        attributes: ["id"],
        raw: true,
      });
      const validUserIds = teamMembers.map((m) => m.id);
      if (validUserIds.length === 0) {
        return res.json([]);
      }
      userIdCondition = { user_id: { [Op.in]: validUserIds } };
    }

    const whereClause = {
      team_id: numericIds,
      ...userIdCondition,
    };

    const taskAssignments = await TaskAssignment.findAll({
      where: whereClause,
      include: [
        {
          model: Team,
          attributes: ["name"],
        },
      ],
      order: [["id", "ASC"]],
    });

    const result = taskAssignments.map((taskAssignment) => {
      const taskAssignmentData = taskAssignment.get({ plain: true });
      const timeDiff = calculateTimeSinceEnd(taskAssignmentData.end);
      taskAssignmentData.timeSinceEnd = timeDiff;
      return taskAssignmentData;
    });

    res.json(result); // ✅ תוקן: result במקום filteredResults
  } catch (error) {
    catchError(error, req, res);
  }
};

exports.getTasksByTeam = async (req, res) => {
  let teamId = req.query["teamId"];
  let selectedCourseBatch = req.query["selectedCourseBatch"];
  const teamMemberWhere = {
    member_role: "STUDENT",
  };

  if (selectedCourseBatch) {
    teamMemberWhere.course_batch_id = selectedCourseBatch;
  }
  if (!teamId) {
    return res.status(400).json({ error: 'Missing "teamId" query parameter' });
  }
  const numericIds = Number(teamId);

  try {
    const taskAssignments = await TaskAssignment.findAll({
      where: {
        team_id: numericIds,
        completed_at: null,
        end: {
          [Op.lt]: new Date(),
        },
      },
      include: [
        {
          model: Team,
          attributes: ["name"],
        },
        {
          model: TeamMember,
          as: "TeamMember",
          where: teamMemberWhere,
          attributes: ["id", "user_id"],
          include: [
            {
              model: User,
              attributes: ["name"],
            },
          ],
        },
      ],
      order: [["id", "ASC"]],
    });

    // קיבוץ לפי שם החייל וספירה
    const result = {};
    taskAssignments.forEach((assignment) => {
      const userName = assignment.TeamMember?.User?.name || "ללא שם";
      if (!result[userName]) {
        result[userName] = { name: userName, value: 0 };
      }
      result[userName].value++;
    });

    const finalResult = Object.values(result);
    res.json(finalResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getGradeStageProgress = async (req, res) => {
  try {
    let teamIds = req.query["teamIds[]"];
    const courseBatchId = req.query.selectedCourseBatch; // ✅ הוספה

    if (!teamIds) {
      return res
        .status(400)
        .json({ error: 'Missing "teamIds" query parameter' });
    }

    if (!Array.isArray(teamIds)) {
      teamIds = [teamIds];
    }

    const numericIds = teamIds.map((id) => Number(id));

    if (numericIds.length === 0 || numericIds.some(isNaN)) {
      return res.status(400).json({ error: "Invalid teamIds" });
    }

    // ✅ בניית תנאי לפי מחזור
    let teamMemberCondition = {};
    let userIdCondition = {};

    if (courseBatchId) {
      const teamMembersData = await TeamMember.findAll({
        where: {
          team_id: { [Op.in]: numericIds },
          course_batch_id: Number(courseBatchId),
        },
        attributes: ["id"],
        raw: true,
      });

      const validUserIds = teamMembersData.map((m) => m.id);

      if (validUserIds.length === 0) {
        return res.json([]); // אין משתמשים במחזור הזה
      }

      teamMemberCondition = {
        team_id: { [Op.in]: numericIds },
        course_batch_id: Number(courseBatchId),
      };

      userIdCondition = { [Op.in]: validUserIds };
    }

    // ✅ בניית תנאי לפי מחזור
    const whereCondition = {
      team_id: { [Op.in]: numericIds },
      ...(courseBatchId && Object.keys(userIdCondition).length > 0
        ? userIdCondition
        : {}),
    };

    const assignments = await TaskAssignment.findAll({
      where: whereCondition, // ✅ סינון לפי מחזור
      include: [
        {
          model: Task,
          as: "Task",
          required: true,
          include: [
            {
              model: GradeStages,
              as: "GradeStages",
              required: true,
            },
          ],
        },
        {
          model: Team,
          attributes: ["id", "name"],
          include: [
            {
              model: TeamMember,
              as: "teamMembers",
              where: teamMemberCondition, // ✅ סינון לפי מחזור
              attributes: ["id"],
            },
          ],
        },
      ],
      order: [["id", "ASC"]],
    });

    const progress = calculateProgress(assignments);
    const data = groupByGradeStage(progress);
    res.json(data);
  } catch (error) {
    catchError(error, req, res);
  }
};

exports.getGradeStageProgressByTeam = async (req, res) => {
  try {
    let teamId = req.query["teamId"];
    const courseBatchId = req.query.selectedCourseBatch; // ✅ הוספה

    if (!teamId) {
      return res
        .status(400)
        .json({ error: 'Missing "teamId" query parameter' });
    }

    const numericTeamId = Number(teamId);

    // ✅ בניית תנאי לפי מחזור
    let teamMemberCondition = {};
    let userIdCondition = {};

    if (courseBatchId) {
      const teamMembersData = await TeamMember.findAll({
        where: {
          team_id: numericTeamId,
          course_batch_id: Number(courseBatchId),
        },
        attributes: ["id"],
        raw: true,
      });

      const validUserIds = teamMembersData.map((m) => m.id);

      if (validUserIds.length === 0) {
        return res.json([]); // אין משתמשים במחזור הזה
      }

      teamMemberCondition = {
        team_id: numericTeamId,
        course_batch_id: Number(courseBatchId),
      };

      userIdCondition = { [Op.in]: validUserIds };
    } else {
      teamMemberCondition = {
        team_id: numericTeamId,
      };
    }

    const assignments = await TaskAssignment.findAll({
      where: {
        team_id: numericTeamId,
        ...(courseBatchId && Object.keys(userIdCondition).length > 0
          ? userIdCondition
          : {}),
      },
      include: [
        {
          model: Task,
          as: "Task",
          required: true,
          include: [
            {
              model: GradeStages,
              as: "GradeStages",
              required: true,
            },
          ],
        },
        {
          model: Team,
          attributes: ["id", "name"],
          include: [
            {
              model: TeamMember,
              as: "teamMembers",
              where: teamMemberCondition, // ✅ סינון לפי מחזור
              attributes: ["id", "user_id"],
              include: [
                {
                  model: User,
                  attributes: ["id", "name"],
                },
              ],
            },
          ],
        },
      ],
      subQuery: false,
    });

    const result = {};
    const filteredAssignments = assignments.filter((a) =>
      a.Team?.teamMembers?.some((tm) => tm.id === a.user_id)
    );

    filteredAssignments.forEach((assignment) => {
      const gradeStageId = assignment.Task?.GradeStages?.id;
      const gradeStageName = assignment.Task?.GradeStages?.name || "ללא שלב";
      const userId = assignment.user_id;

      let userName = null;

      for (const tm of assignment.Team?.teamMembers || []) {
        if (tm.id === userId) {
          userName = tm.User?.name;
          break;
        }
      }

      userName = userName || "ללא שם";

      if (!gradeStageId) return;

      if (!result[gradeStageId]) {
        result[gradeStageId] = {
          gradeStageId: gradeStageId,
          gradeStageName: gradeStageName,
          soldiers: [],
        };
      }

      let soldier = result[gradeStageId].soldiers.find(
        (s) => s.userId === userId
      );

      if (!soldier) {
        soldier = {
          userId: userId,
          userName: userName,
          totalAssignments: 0,
          completedCount: 0,
        };
        result[gradeStageId].soldiers.push(soldier);
      }

      soldier.totalAssignments++;

      if (assignment.completed_at) {
        soldier.completedCount++;
      }
    });

    const finalResult = Object.values(result).map((gradeStage) => ({
      gradeStageId: gradeStage.gradeStageId,
      gradeStageName: gradeStage.gradeStageName,
      soldiers: gradeStage.soldiers.map((soldier) => ({
        userId: soldier.userId,
        userName: soldier.userName,
        totalAssignments: soldier.totalAssignments,
        completedCount: soldier.completedCount,
        completionPercentage:
          soldier.totalAssignments > 0
            ? Math.round(
              (soldier.completedCount / soldier.totalAssignments) * 100
            )
            : 0,
      })),
    }));

    res.json(finalResult);
  } catch (error) {
    catchError(error, req, res);
  }
};

function calculateProgress(assignments) {
  const grouped = {};

  assignments.forEach((assignment) => {
    const gradeStageId = assignment.Task?.GradeStages?.id;
    const gradeStageName = assignment.Task?.GradeStages?.name;
    const teamId = assignment.team_id;
    const teamName = assignment.Team?.name;
    const isCompleted = assignment.completed_at !== null;
    const totalSoldiers = assignment.Team.dataValues.teamMembers?.length || 0;

    if (!gradeStageId) return;

    const key = `${gradeStageId}-${teamId}`;

    if (!grouped[key]) {
      grouped[key] = {
        gradeStageId,
        gradeStageName,
        teamId,
        teamName,
        totalSoldiers,
        totalAssignments: 0,
        completedCount: 0,
      };
    }

    grouped[key].totalAssignments++;
    if (isCompleted) {
      grouped[key].completedCount++;
    }
  });

  return Object.values(grouped).map((item) => ({
    ...item,
    completionPercentage:
      item.totalAssignments > 0
        ? Math.round((item.completedCount / item.totalAssignments) * 10000) /
        100
        : 0,
  }));
}

function groupByGradeStage(data) {
  const grouped = {};

  data.forEach((item) => {
    const key = item.gradeStageName;

    if (!grouped[key]) {
      grouped[key] = {
        gradeStageId: item.gradeStageId,
        gradeStageName: item.gradeStageName,
        teams: [],
      };
    }

    grouped[key].teams.push({
      teamId: item.teamId,
      teamName: item.teamName,
      totalSoldiers: item.totalSoldiers,
      totalAssignments: item.totalAssignments,
      completedCount: item.completedCount,
      completionPercentage: item.completionPercentage,
    });
  });

  return Object.values(grouped);
}

exports.duplicate = async (req, res) => {
  const sourceId = req.params.id;
  try {
    const sourceTask = await Task.findByPk(sourceId);
    if (!sourceTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    const { id, createdAt, updatedAt, ...taskData } = sourceTask.get({
      plain: true,
    });

    const newTask = await Task.create(taskData);

    logger.info('Task duplicated', {
      sourceTaskId: sourceId,
      newTaskId: newTask.id,
      taskName: newTask.name,
      userId: req.headers['x-user-id']
    });
    return res.status(201).json(newTask);
  } catch (err) {
    catchError(err, req, res);
  }
};

exports.deleteAllTaskTags = async (req, res) => {
  const taskId = Number(req.params.taskId);
  if (Number.isNaN(taskId))
    return res.status(400).json({ message: "Invalid taskId." });

  try {
    const deleted = await TaskTags.destroy({ where: { task_id: taskId } });

    logger.info('TaskTags deleted', {
      taskId: taskId,
      deletedCount: deleted,
      userId: req.headers['x-user-id']
    });
    return res.status(200).json({ deleted });
  } catch (err) {
    catchError(err, req, res);
  }
};

exports.addTagsToTask = async (req, res) => {
  const taskId = Number(req.params.taskId);
  const incoming = req.body; // [{ tagId: 1 }, { tagId: 2 }, …]

  if (Number.isNaN(taskId))
    return res.status(400).json({ message: "Invalid taskId." });
  if (
    !Array.isArray(incoming) ||
    incoming.some((i) => Number.isNaN(Number(i.tagId)))
  ) {
    return res
      .status(400)
      .json({ message: "Invalid payload – array of { tagId } expected." });
  }

  const tagIds = incoming.map((i) => Number(i.tagId));

  // 1️⃣  Vérifier que les tags existent réellement (optionnel mais recommandé)
  const existingTags = await Tags.findAll({
    where: { id: { [Op.in]: tagIds } },
  });
  if (existingTags.length !== tagIds.length) {
    return res.status(404).json({ message: "One or more tags not found." });
  }

  // 2️⃣  Insérer les relations (ignore les doublons grâce à `ignoreDuplicates` de bulkCreate)
  const rows = tagIds.map((id) => ({ task_id: taskId, tag_id: id }));

  try {
    await TaskTags.bulkCreate(rows, { ignoreDuplicates: true });

    logger.info('Tags added to task', {
      taskId: taskId,
      tagIds: tagIds,
      tagsCount: tagIds.length,
      userId: req.headers['x-user-id']
    });
    return res.status(201).json({ taskId, linkedTagIds: tagIds });
  } catch (err) {
    catchError(err, req, res);
  }
};
exports.getTaskTags = async (req, res) => {
  const taskId = Number(req.params.taskId);

  if (Number.isNaN(taskId)) {
    return res.status(400).json({ message: "taskId must be a number" });
  }

  try {
    const task = await Task.findByPk(taskId, {
      include: [
        {
          model: Tags,
          as: "tags", // identique au alias déclaré ci‑dessus
          attributes: ["id", "tagName"], // on ne renvoie que ce qui nous intéresse
          through: { attributes: [] }, // n’inclut pas les colonnes de la table de jointure
        },
      ],
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // task.tags est déjà un tableau d’objets Tags
    return res.status(200).json({
      taskId,
      tags: task.tags, // [{ id: 3, tagName: "math" }, …]
    });
  } catch (err) {
    catchError(err, req, res);
  }
};

exports.getTasksByTagId = async (req, res) => {
  let tagIds = null;
  if (req.query.ids) {
    tagIds = req.query.ids
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => !Number.isNaN(n));
    if (tagIds.length === 0) {
      return res
        .status(400)
        .json({ message: "Query param 'ids' is malformed." });
    }
  }

  try {
    const tags = await Tags.findAll({
      attributes: ["id", "tagName"],
      where: tagIds ? { id: { [Op.in]: tagIds } } : undefined,
      include: [
        {
          model: Task,
          as: "tasks",
          attributes: [
            "id",
            "name",
            "description",
            "status",
            "linkUrl",
            "recommendedTime",
            "color",
          ],
          through: { attributes: [] },
        },
      ],
      order: [["tagName", "ASC"]],
    });

    const map = {};

    tags.forEach((tag) => {
      map[tag.tagName] = tag.tasks;
    });

    return res.status(200).json(map);
  } catch (err) {
    catchError(err, req, res);
  }
};

// TASK BY TAG
exports.getTasksByTagIdsTeam = async (req, res) => {
  try {
    const tagIds = req.query.tagIds;
    const teamId = req.query.teamId ?? null;
    const selectedCourseBatch = req.query.selectedCourseBatch;
    const tagIdsArray = Array.isArray(tagIds)
      ? tagIds
      : tagIds
        ? tagIds.split(",").map((id) => id.trim())
        : [];

    if (tagIdsArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least tagId is required",
      });
    }
    const tags = await Tags.findAll({
      where: { id: tagIdsArray },
      attributes: ["id", "tagName"],
      raw: true,
    });
    if (tags.length === 0) {
      return res.status(404).json({
        success: false,
        message: "none tag found",
      });
    }
    const query = `
SELECT
    t.id,
    t.name,
    t.status,
    t.color,
    t.team_id,
    t."recommendedTime",
    tt.tag_id AS "tagId",
    tg_tag."tagName",     
    tg_tag.id AS "tagIdOriginal",
    CASE
        WHEN :teamId IS NULL THEN 0
        ELSE COUNT(DISTINCT ta.user_id)
    END AS assignedcount,
    CASE
        WHEN :teamId IS NULL THEN 0
        ELSE COALESCE(COUNT(DISTINCT tm.id), 0)
    END AS totalmembers,
    CASE
        WHEN :teamId IS NULL THEN 0
        WHEN COUNT(DISTINCT tm.id) > 0 THEN
            ROUND(
                (COUNT(DISTINCT ta.user_id)::decimal /
                 COUNT(DISTINCT tm.id)) * 100,
                2
            )
        ELSE 0
    END AS completionrate,
    COALESCE(
        ARRAY_AGG(DISTINCT tm.user_id) FILTER (
            WHERE ta.completed IS NOT NULL
              AND (:teamId IS NULL OR tm.team_id = :teamId)
        ),
        '{}'::int[]
    ) AS completed_tm_ids
FROM "Tasks"               t
INNER JOIN "TaskTags"      tt   ON tt."task_id" = t.id
INNER JOIN "Tags"          tg_tag ON tg_tag.id = tt.tag_id 
LEFT JOIN "TaskGroups"     tg   ON tg.id = t."taskGroupId"
LEFT JOIN "Axes"           a    ON a.id = tg."axisId"
LEFT JOIN "Courses"        c    ON c.id = a."courseId"
LEFT JOIN "CourseBatches"  cb   ON cb."courseId" = c.id AND cb.id = :selectedCourseBatch
LEFT JOIN "TeamCourseBatches" tcb ON tcb.course_batch_id = cb.id  AND tcb."team_id" = :teamId
LEFT JOIN "Teams" teams ON teams.id = tcb.team_id
LEFT JOIN "TeamMembers"    tm   ON tm."team_id" = teams.id
                                AND tm."member_role" = 'STUDENT' AND tm."course_batch_id" = :selectedCourseBatch
LEFT JOIN "TaskAssignments" ta  ON ta."task_id" = t.id
                                AND ta."user_id" = tm.id
WHERE tt.tag_id IN (:tagIds)
   AND (:teamId IS NULL OR t.team_id = :teamId OR t.team_id IS NULL)
   -- AND (:teamId IS NULL OR tm."team_id" = :teamId)
GROUP BY
    t.id,
    t.name,
    t.status,
    t.color,
    t.team_id,
    tt.tag_id,
    tg_tag."tagName",
    tg_tag.id    
ORDER BY
    t.id,
    tg_tag."tagName";
    `;
    const results = await sequelize.query(query, {
      replacements: {
        tagIds: tagIdsArray,
        teamId: teamId,
        selectedCourseBatch: selectedCourseBatch,
      },
      type: sequelize.QueryTypes.SELECT,
      raw: true,
    });
    const groupedByTag = {};
    tags.forEach((tag) => {
      groupedByTag[tag.tagName] = {
        tagId: tag.id,
        operational: [],
        assignmentBank: [],
        archives: [],
      };
    });
    const taskBS = await TaskBatchStatus.findAll();
    results.forEach((task) => {
      const tagName = task.tagName;
      if (!groupedByTag[tagName]) {
        groupedByTag[tagName] = {
          tagId: task.tagId,
          operational: [],
          assignmentBank: [],
          archives: [],
        };
      }
      const matchingTask = taskBS.find(
        (tbs) =>
          tbs.course_batch_id == selectedCourseBatch && tbs.taskId == task.id
      );
      if (matchingTask) {
        switch (matchingTask.status) {
          case "operational":
            groupedByTag[tagName].operational.push(task);
            break;
          case "assignment_bank":
            groupedByTag[tagName].assignmentBank.push(task);
            break;
          case "archives":
            groupedByTag[tagName].archives.push(task);
            break;
        }
      }
    });
    res.status(200).json({
      success: true,
      data: {
        byTag: groupedByTag,
      },
    });
  } catch (error) {
    catchError(error, req, res);
  }
};

exports.getTasksByTagIdsUser = async (req, res) => {
  try {
    const tagIds = req.query.tagIds;
    const teamId = req.query.teamId ?? null;
    const selectedCourseBatch = req.query.selectedCourseBatch;
    const userId = req.query.userId ?? null;
    const tagIdsArray = Array.isArray(tagIds)
      ? tagIds
      : tagIds
        ? tagIds.split(",").map((id) => id.trim())
        : [];

    const tags = await Tags.findAll({
      where: tagIdsArray.length > 0 ? { id: tagIdsArray } : {},
      attributes: ["id", "tagName"],
      raw: true,
    });
    if (tags.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one tagId required",
      });
    }
    const query = `
SELECT 
    t.id,
    t.name,
    t.status,
    t.color,
    t.team_id,
    tt.tag_id AS "tagId",
    tg_tag."tagName" ,
    tg_tag.id AS "tagIdOriginal",
    CASE 
        WHEN :teamId IS NULL THEN NULL
        ELSE TA.COMPLETED
    END AS COMPLETED,
    CASE 
        WHEN :teamId IS NULL THEN NULL
        ELSE TA.COMPLETED_AT
    END AS COMPLETED_AT,
    CASE 
        WHEN :teamId IS NULL THEN NULL
        ELSE ta."start"
    END AS ASSIGNED,
    TA.ID AS TASK_ASSIGNMENT_ID
FROM "Tasks" t
INNER JOIN "TaskTags" tt ON tt."task_id" = t.id
INNER JOIN "Tags" tg_tag ON tg_tag.id = tt.tag_id
LEFT JOIN "TaskGroups" tg ON tg.id = t."taskGroupId"
LEFT JOIN "Axes" a ON a.id = tg."axisId"
LEFT JOIN "Courses" c ON c.id = a."courseId"
LEFT JOIN "CourseBatches" cb ON cb."courseId" = c.id
LEFT JOIN "TeamCourseBatches" tcb ON tcb.course_batch_id = cb.id
LEFT JOIN "Teams" teams ON teams.id = tcb.team_id  
LEFT JOIN "TaskAssignments" ta 
    ON ta."task_id" = t.id AND ta."user_id" = :userId
WHERE tt.tag_id IN (:tagIds) AND (:teamId IS NULL OR t.team_id = :teamId OR t.team_id IS NULL) AND teams.id = :teamId
ORDER BY t.id, tg_tag."tagName";
    `;
    const results = await sequelize.query(query, {
      replacements: {
        tagIds: tagIdsArray,
        teamId,
        userId,
      },
      type: sequelize.QueryTypes.SELECT,
      raw: true,
    });
    const groupedByTag = {};
    tags.forEach((tag) => {
      groupedByTag[tag.tagName] = {
        tagId: tag.id,
        operational: [],
        assignmentBank: [],
        archives: [],
      };
    });
    const taskMap = new Map(); // key = `${tagName}-${task.id}`
    results.forEach((task) => {
      const mapKey = `${task.tagName}-${task.id}`;
      const existing = taskMap.get(mapKey);
      if (!existing) {
        taskMap.set(mapKey, task);
        return;
      }
      const existingCompleted = existing.COMPLETED ?? existing.completed;
      const currentCompleted = task.COMPLETED ?? task.completed;
      if (!existingCompleted && currentCompleted) {
        taskMap.set(mapKey, task);
      }
    });
    const taskBS = await TaskBatchStatus.findAll();
    const statusMap = new Map();
    taskBS.forEach((tbs) => {
      const key = `${tbs.taskId}-${tbs.course_batch_id}`;
      statusMap.set(key, tbs.status);
    });
    taskMap.forEach((task) => {
      const tagName = task.tagName;
      const status = statusMap.get(`${task.id}-${selectedCourseBatch}`);
      if (status && groupedByTag[tagName]) {
        switch (status) {
          case "operational":
            groupedByTag[tagName].operational.push(task);
            break;
          case "assignment_bank":
            groupedByTag[tagName].assignmentBank.push(task);
            break;
          case "archives":
            groupedByTag[tagName].archives.push(task);
            break;
        }
      }
    });
    res.status(200).json({
      success: true,
      data: {
        byTag: groupedByTag,
      },
    });
  } catch (error) {
    catchError(error, req, res);
  }
};

exports.getTasksByTeamIds = async (req, res) => {
  try {
    let teamIds = req.query["teamIds[]"];
    const courseBatchId = req.query.courseBatchId; // ✅ הוספה

    if (!teamIds) {
      return res
        .status(400)
        .json({ error: 'Missing "teamIds" query parameter' });
    }

    if (!Array.isArray(teamIds)) {
      teamIds = [teamIds];
    }

    const numericIds = teamIds.map((id) => Number(id));
    if (numericIds.length === 0) {
      return res
        .status(400)
        .json({ error: "No valid numeric TeamIDs were provided" });
    }

    // ✅ בניית תנאי לפי מחזור
    let userIdCondition = {};

    if (courseBatchId) {
      const teamMembers = await TeamMember.findAll({
        where: {
          team_id: { [Op.in]: numericIds },
          course_batch_id: Number(courseBatchId),
        },
        attributes: ["id"],
        raw: true,
      });

      const validUserIds = teamMembers.map((m) => m.id);

      if (validUserIds.length === 0) {
        return res.json([]); // אין משתמשים במחזור הזה
      }

      userIdCondition = { user_id: { [Op.in]: validUserIds } };
    }

    // ✅ שליפת TaskAssignments עם סינון
    const taskAssignments = await TaskAssignment.findAll({
      where: {
        team_id: { [Op.in]: numericIds },
        ...userIdCondition, // ✅ סינון לפי מחזור
      },
      include: [
        {
          model: Team,
          attributes: ["name"],
        },
      ],
      order: [["id", "ASC"]],
    });

    // שליפת Task IDs ייחודיים
    const taskIds = [...new Set(taskAssignments.map((ta) => ta.task_id))];

    // שליפת פרטי המשימות
    const tasks = await Task.findAll({
      where: { id: { [Op.in]: taskIds } },
      include: [
        {
          model: User,
          attributes: ["name"],
        },
      ],
      order: [["id", "ASC"]],
    });

    res.json(tasks);
  } catch (err) {
    catchError(err, req, res);
  }
};

exports.confirmTask = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [updatedCount] = await Task.update(
      { is_seen: true },
      {
        where: { id: id },
      }
    );

    if (updatedCount === 0) {
      return res.status(404).json({
        success: false,
        msg: "No task found with the given team_id.",
      });
    }

    logger.info('Task confirmed (is_seen=true)', {
      taskId: id,
      userId: req.headers['x-user-id']
    });

    return res.status(200).json({
      success: true,
      msg: "Task updated successfully!",
    });
  } catch (error) {
    console.log(error);
  }
};
//TASK BY COLOR
exports.getTasksByColorTeam = async (req, res) => {
  try {
    const teamId = req.query.teamId ?? null;
    const selectedCourseBatch = req.query.selectedCourseBatch;
    const query = `
SELECT 
    t.id,
    t.name,
    t.status,
    t.color,
    t.team_id,
    t."recommendedTime",
    CASE
        WHEN :teamId IS NULL THEN 0
        ELSE COUNT(DISTINCT ta.user_id)
    END AS assignedcount,
    -- total number of team members (only when a concrete team is requested)
    CASE
        WHEN :teamId IS NULL THEN 0
        ELSE COALESCE(COUNT(DISTINCT tm.id),0)
    END AS totalmembers,
    -- completion rate (same logic as before)
    CASE
        WHEN :teamId IS NULL                         THEN 0
        WHEN COUNT(DISTINCT tm.id) > 0               THEN
            ROUND(
                (COUNT(DISTINCT ta.user_id)::decimal /
                 COUNT(DISTINCT tm.id)) * 100,
                2)
        ELSE 0
    END AS completionrate,
    -- TM ids: completed is NOT NULL AND completed_at is NOT NULL
    COALESCE(
        ARRAY_AGG(DISTINCT tm.user_id) FILTER (
            WHERE ta.completed is NOT NULL
              AND ta.completed_at IS NOT NULL
              AND (:teamId IS NULL OR tm.team_id = :teamId)
        ),
        '{}'::int[]
    ) AS completed_all_tm_ids,
    -- TM ids: completed_at IS NOT NULL AND  completed IS NULL
    COALESCE(
        ARRAY_AGG(DISTINCT tm.user_id) FILTER (
            WHERE ta.completed_at IS NOT NULL
              AND ta.completed IS NULL
              AND (:teamId IS NULL OR tm.team_id = :teamId)
        ),
        '{}'::int[]
    ) AS completed_at_only_tm_ids,
    -- TM ids: completed is NOT NULL AND completed_at IS NULL
    COALESCE(
        ARRAY_AGG(DISTINCT tm.user_id) FILTER (
            WHERE ta.completed is NOT NULL
              AND ta.completed_at IS NULL
              AND (:teamId IS NULL OR tm.team_id = :teamId)
        ),
        '{}'::int[]
    ) AS completed_only_tm_ids
FROM "Tasks" t
LEFT JOIN "TaskGroups" tg ON tg.id = t."taskGroupId"
LEFT JOIN "Axes" a ON a.id = tg."axisId"
LEFT JOIN "Courses" c ON c.id = a."courseId"
LEFT JOIN "CourseBatches" cb ON cb."courseId" = c.id
LEFT JOIN "TeamCourseBatches" tcb ON tcb.course_batch_id = cb.id
LEFT JOIN "Teams" teams ON teams.id = tcb.team_id
LEFT JOIN "TeamMembers"   tm   ON tm."team_id" = teams.id
                               AND tm."member_role" = 'STUDENT' AND tm."course_batch_id" = :selectedCourseBatch
LEFT JOIN "TaskAssignments" ta ON ta."task_id" = t.id
                               AND ta."user_id" = tm.id     -- correct key
WHERE (:teamId IS NULL OR t.team_id = :teamId OR t.team_id IS NULL) AND (:teamId IS NULL OR tm."team_id" = :teamId)
GROUP BY
    t.id,
    t.name,
    t.status,
    t.color,
    t.team_id;
    `;
    const results = await sequelize.query(query, {
      replacements: { teamId, selectedCourseBatch },
      type: sequelize.QueryTypes.SELECT,
      raw: true,
    });
    const taskBS = await TaskBatchStatus.findAll();
    const statusMap = new Map();
    taskBS.forEach((tbs) => {
      const key = `${tbs.taskId}-${tbs.course_batch_id}`;
      statusMap.set(key, tbs.status);
    });
    const groupedByColor = {};
    const colorOrder = [];
    results.forEach((task) => {
      const color =
        task.color && task.color.trim() !== "" ? task.color : "no-color";
      if (!groupedByColor[color]) {
        groupedByColor[color] = {
          color: color === "no-color" ? null : color,
          operational: [],
          assignmentBank: [],
          archives: [],
        };
        colorOrder.push(color);
      }
      const status = statusMap.get(`${task.id}-${selectedCourseBatch}`);
      if (status) {
        switch (status) {
          case "operational":
            groupedByColor[color].operational.push(task);
            break;
          case "assignment_bank":
            groupedByColor[color].assignmentBank.push(task);
            break;
          case "archives":
            groupedByColor[color].archives.push(task);
            break;
        }
      }
    });
    const colorGroups = colorOrder.map((color) => groupedByColor[color]);
    res.status(200).json({
      success: true,
      data: {
        byColor: colorGroups,
      },
    });
  } catch (error) {
    catchError(error, req, res);
  }
};

exports.getTasksByColorUser = async (req, res) => {
  try {
    const teamId = req.query.teamId ?? null;
    const selectedCourseBatch = req.query.selectedCourseBatch;
    const userId = req.query.userId ?? null;
    const query = `
    SELECT DISTINCT
        t.id,
        t.name,
        t.status,
        t.color,
        t.team_id,
        CASE 
            WHEN :teamId IS NULL THEN NULL
            ELSE TA.COMPLETED
        END AS COMPLETED,
        CASE 
            WHEN :teamId IS NULL THEN NULL
            ELSE TA.COMPLETED_AT
        END AS COMPLETED_AT,
        CASE 
            WHEN :teamId IS NULL THEN NULL
            ELSE ta."start"
        END AS ASSIGNED,
        TA.ID AS TASK_ASSIGNMENT_ID
    FROM "Tasks" t
    LEFT JOIN "TaskGroups" tg ON tg.id = t."taskGroupId"
    LEFT JOIN "TaskAssignments" ta 
        ON ta."task_id" = t.id AND ta."user_id" = :userId
    WHERE (:teamId IS NULL OR t.team_id = :teamId OR t.team_id IS NULL) 
    ORDER BY t.id, t.color;
    `;
    const results = await sequelize.query(query, {
      replacements: {
        teamId,
        userId,
      },
      type: sequelize.QueryTypes.SELECT,
      raw: true,
    });
    const taskBS = await TaskBatchStatus.findAll();
    const statusMap = new Map();
    taskBS.forEach((tbs) => {
      const key = `${tbs.taskId}-${tbs.course_batch_id}`;
      statusMap.set(key, tbs.status);
    });
    const groupedByColor = {};
    const colorOrder = [];
    results.forEach((task) => {
      const color =
        task.color && task.color.trim() !== "" ? task.color : "no-color";
      if (!groupedByColor[color]) {
        groupedByColor[color] = {
          color: color === "no-color" ? null : color,
          operational: [],
          assignmentBank: [],
          archives: [],
        };
        colorOrder.push(color);
      }
      const status = statusMap.get(`${task.id}-${selectedCourseBatch}`);
      if (status) {
        switch (status) {
          case "operational":
            groupedByColor[color].operational.push(task);
            break;
          case "assignment_bank":
            groupedByColor[color].assignmentBank.push(task);
            break;
          case "archives":
            groupedByColor[color].archives.push(task);
            break;
        }
      }
    });
    const colorGroups = colorOrder.map((color) => groupedByColor[color]);
    res.status(200).json({
      success: true,
      data: {
        byColor: colorGroups,
      },
    });
  } catch (error) {
    catchError(error, req, res);
  }
};

//TASK BY GRADE STAGE
exports.getTasksByGradeStageIdTeam = async (req, res) => {
  try {
    const gradeStageIds = req.query.gradeStageIds;
    const teamId = req.query.teamId ?? null;
    const selectedCourseBatch = req.query.selectedCourseBatch;
    const gradeStageIdsArray = Array.isArray(gradeStageIds)
      ? gradeStageIds
      : gradeStageIds
        ? gradeStageIds.split(",").map((id) => id.trim())
        : [];

    if (gradeStageIdsArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least tagId is required",
      });
    }
    const gradeStages = await GradeStages.findAll({
      where: { id: gradeStageIdsArray },
      attributes: ["id", "name"],
      raw: true,
    });
    if (gradeStages.length === 0) {
      return res.status(404).json({
        success: false,
        message: "none tag found",
      });
    }
    const query = `
SELECT
    t.id,
    t.name,
    t.status,
    t.color,
    t.team_id,
    t."recommendedTime",
    gs.name as "gsName",     
    gs.id AS "gsId",
    CASE
        WHEN :teamId IS NULL THEN 0
        ELSE COUNT(DISTINCT ta.user_id)
    END AS assignedcount,
    CASE
        WHEN :teamId IS NULL THEN 0
        ELSE COALESCE(COUNT(DISTINCT tm.id), 0)
    END AS totalmembers,
    CASE
        WHEN :teamId IS NULL THEN 0
        WHEN COUNT(DISTINCT tm.id) > 0 THEN
            ROUND(
                (COUNT(DISTINCT ta.user_id)::decimal /
                 COUNT(DISTINCT tm.id)) * 100,
                2
            )
        ELSE 0
    END AS completionrate,
    COALESCE(
        ARRAY_AGG(DISTINCT tm.user_id) FILTER (
            WHERE ta.completed is NOT NULL
              AND (:teamId IS NULL OR tm.team_id = :teamId)
        ),
        '{}'::int[]
    ) AS completed_tm_ids
FROM "Tasks"               t
INNER JOIN "GradeStages"   gs ON gs.id = t."gradeStageId"
LEFT JOIN "TaskGroups"     tg   ON tg.id = t."taskGroupId"
LEFT JOIN "Axes"           a    ON a.id = tg."axisId"
LEFT JOIN "Courses"        c    ON c.id = a."courseId"
LEFT JOIN "CourseBatches"  cb   ON cb."courseId" = c.id AND cb.id = :selectedCourseBatch
LEFT JOIN "TeamCourseBatches" tcb ON tcb.course_batch_id = cb.id AND tcb."team_id" = :teamId
LEFT JOIN "Teams" teams ON teams.id = tcb.team_id
LEFT JOIN "TeamMembers"    tm   ON tm."team_id" = teams.id
                                AND tm."member_role" = 'STUDENT' AND tm."course_batch_id" = :selectedCourseBatch
LEFT JOIN "TaskAssignments" ta  ON ta."task_id" = t.id
                                AND ta."user_id" = tm.id
WHERE t."gradeStageId" IN (:gradeStageIds)
 AND (:teamId IS NULL OR t.team_id = :teamId OR t.team_id IS NULL)
 -- AND (:teamId IS NULL OR tm."team_id" = :teamId)
GROUP BY
    t.id,
    t.name,
    t.status,
    t.color,
    t.team_id,
    gs.id,
    gs.name
ORDER BY
    t.id,
    gs.name;
    `;
    const results = await sequelize.query(query, {
      replacements: {
        gradeStageIds: gradeStageIdsArray,
        teamId: teamId,
        selectedCourseBatch: selectedCourseBatch,
      },
      type: sequelize.QueryTypes.SELECT,
      raw: true,
    });
    const groupedByGradeStage = {};
    gradeStages.forEach((gs) => {
      groupedByGradeStage[gs.name] = {
        gsId: gs.id,
        operational: [],
        assignmentBank: [],
        archives: [],
      };
    });
    const taskBS = await TaskBatchStatus.findAll();
    results.forEach((task) => {
      const gradeStageName = task.gsName;
      if (!groupedByGradeStage[gradeStageName]) {
        groupedByGradeStage[gradeStageName] = {
          gsId: task.gsId,
          operational: [],
          assignmentBank: [],
          archives: [],
        };
      }
      const matchingTask = taskBS.find(
        (tbs) =>
          tbs.course_batch_id == selectedCourseBatch && tbs.taskId == task.id
      );
      if (matchingTask) {
        switch (matchingTask.status) {
          case "operational":
            groupedByGradeStage[gradeStageName].operational.push(task);
            break;
          case "assignment_bank":
            groupedByGradeStage[gradeStageName].assignmentBank.push(task);
            break;
          case "archives":
            groupedByGradeStage[gradeStageName].archives.push(task);
            break;
        }
      }
    });
    res.status(200).json({
      success: true,
      data: {
        byGradeStage: groupedByGradeStage,
      },
    });
  } catch (error) {
    catchError(error, req, res);
  }
};

exports.getTasksByGradeStageIdUser = async (req, res) => {
  try {
    const gradeStageIds = req.query.gradeStageIds;
    const teamId = req.query.teamId ?? null;
    const selectedCourseBatch = req.query.selectedCourseBatch;
    const userId = req.query.userId ?? null;
    const gradeStageIdsArray = Array.isArray(gradeStageIds)
      ? gradeStageIds
      : gradeStageIds
        ? gradeStageIds.split(",").map((id) => id.trim())
        : [];

    if (gradeStageIdsArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least tagId is required",
      });
    }
    const gradeStages = await GradeStages.findAll({
      where: { id: gradeStageIdsArray },
      attributes: ["id", "name"],
      raw: true,
    });
    if (gradeStages.length === 0) {
      return res.status(404).json({
        success: false,
        message: "none tag found",
      });
    }
    const query = `
SELECT 
    t.id,
    t.name,
    t.status,
    t.color,
    t.team_id,
    gs.name as "gsName",
    gs.id AS "gsId",
    CASE 
        WHEN :teamId IS NULL THEN NULL
        ELSE TA.COMPLETED
    END AS COMPLETED,
    CASE 
        WHEN :teamId IS NULL THEN NULL
        ELSE TA.COMPLETED_AT
    END AS COMPLETED_AT,
    CASE 
        WHEN :teamId IS NULL THEN NULL
        ELSE ta."start"
    END AS ASSIGNED,
    TA.ID AS TASK_ASSIGNMENT_ID
FROM "Tasks" t
INNER JOIN "GradeStages"   gs ON gs.id = t."gradeStageId"
LEFT JOIN "TaskGroups" tg ON tg.id = t."taskGroupId"
LEFT JOIN "Axes" a ON a.id = tg."axisId"
LEFT JOIN "Courses" c ON c.id = a."courseId"
LEFT JOIN "CourseBatches" cb ON cb."courseId" = c.id
LEFT JOIN "TeamCourseBatches" tcb ON tcb.course_batch_id = cb.id
LEFT JOIN "Teams" teams ON teams.id = tcb.team_id
LEFT JOIN "TaskAssignments" ta 
    ON ta."task_id" = t.id AND ta."user_id" = :userId
WHERE t."gradeStageId" IN (:gradeStageIds) AND (:teamId IS NULL OR t.team_id = :teamId OR t.team_id IS NULL) AND teams.id = :teamId
ORDER BY t.id, gs.name;
    `;
    const results = await sequelize.query(query, {
      replacements: {
        gradeStageIds: gradeStageIdsArray,
        teamId,
        userId,
      },
      type: sequelize.QueryTypes.SELECT,
      raw: true,
    });
    const groupedByGradeStage = {};
    gradeStages.forEach((gs) => {
      groupedByGradeStage[gs.name] = {
        gsId: gs.id,
        operational: [],
        assignmentBank: [],
        archives: [],
      };
    });
    const taskMap = new Map(); // key = `${tagName}-${task.id}`
    results.forEach((task) => {
      const mapKey = `${task.gsName}-${task.id}`;
      const existing = taskMap.get(mapKey);
      if (!existing) {
        taskMap.set(mapKey, task);
        return;
      }
      const existingCompleted = existing.COMPLETED ?? existing.completed;
      const currentCompleted = task.COMPLETED ?? task.completed;
      if (!existingCompleted && currentCompleted) {
        taskMap.set(mapKey, task);
      }
    });
    const taskBS = await TaskBatchStatus.findAll();
    const statusMap = new Map();
    taskBS.forEach((tbs) => {
      const key = `${tbs.taskId}-${tbs.course_batch_id}`;
      statusMap.set(key, tbs.status);
    });
    taskMap.forEach((task) => {
      const gsName = task.gsName;
      const status = statusMap.get(`${task.id}-${selectedCourseBatch}`);
      if (status && groupedByGradeStage[gsName]) {
        switch (status) {
          case "operational":
            groupedByGradeStage[gsName].operational.push(task);
            break;
          case "assignment_bank":
            groupedByGradeStage[gsName].assignmentBank.push(task);
            break;
          case "archives":
            groupedByGradeStage[gsName].archives.push(task);
            break;
        }
      }
    });
    res.status(200).json({
      success: true,
      data: {
        byGradeStage: groupedByGradeStage,
      },
    });
  } catch (error) {
    catchError(error, req, res);
  }
};

// FOR THE SEARCH AND FILTER
exports.getFilterOptions = async (req, res) => {
  try {
    const { courseBatchId, teamId, status } = req.query;

    // Récupérer les couleurs uniques utilisées
    const colorsQuery = `
      SELECT DISTINCT t.color
      FROM "Tasks" t
      JOIN "TaskGroups" tg ON t."taskGroupId" = tg.id
      JOIN "TaskGroupBatchStatus" tgb ON tg.id = tgb."taskGroupId"
      WHERE t."deletedAt" IS NULL
        AND tg."deletedAt" IS NULL
        AND tgb."course_batch_id" = :courseBatchId
        AND (t."team_id" = :teamId OR t."team_id" IS NULL)
        AND t.color IS NOT NULL
        AND t.status = :status
      ORDER BY t.color
    `;

    // Récupérer les tags
    const tagsQuery = `
      SELECT DISTINCT tg.id, tg."tagName"
      FROM "Tags" tg
      JOIN "TaskTags" tt ON tg.id = tt.tag_id
      JOIN "Tasks" t ON tt.task_id = t.id
      JOIN "TaskGroups" tgg ON t."taskGroupId" = tgg.id
      JOIN "TaskGroupBatchStatus" tgb ON tgg.id = tgb."taskGroupId"
      WHERE t."deletedAt" IS NULL
        AND tgb."course_batch_id" = :courseBatchId
        AND (t."team_id" = :teamId OR t."team_id" IS NULL)
        AND t.status = :status
      ORDER BY tg."tagName"
    `;

    // Récupérer les grade stages
    const gradeStagesQuery = `
      SELECT DISTINCT gs.id, gs.name
      FROM "GradeStages" gs
      JOIN "Courses" c ON gs.course_id = c.id
      JOIN "CourseBatches" cb ON c.id = cb."courseId"
      WHERE cb.id = :courseBatchId
      ORDER BY gs.name
    `;

    const [colors, tags, gradeStages] = await Promise.all([
      sequelize.query(colorsQuery, {
        replacements: { courseBatchId, teamId, status },
        type: sequelize.QueryTypes.SELECT,
      }),
      sequelize.query(tagsQuery, {
        replacements: { courseBatchId, teamId, status },
        type: sequelize.QueryTypes.SELECT,
      }),
      sequelize.query(gradeStagesQuery, {
        replacements: { courseBatchId, teamId },
        type: sequelize.QueryTypes.SELECT,
      }),
    ]);

    return res.json({
      success: true,
      data: {
        colors: colors.map((c) => c.color).filter(Boolean),
        tags,
        gradeStages,
      },
    });
  } catch (error) {
    catchError(error, req, res);
  }
};

exports.advancedSearch = async (req, res) => {
  try {
    const { query, courseBatchId, teamId, filterOption } = req.query;

    let queryObj = null;
    try {
      queryObj = query ? JSON.parse(query) : null;
    } catch (e) {
      queryObj = null;
    }

    if (!queryObj) {
      return res.json({
        success: true,
        data: { operational: [], assignment_bank: [], archives: [] },
      });
    }

    // BUILD THE FILTER
    const { whereClause, replacements } = buildWhereClause(queryObj);
    let statusFilter = "";
    if (filterOption === "operational") {
      statusFilter = `AND tgb.status = 'operational' AND t.status = 'operational'`;
    } else if (filterOption === "assignment_bank") {
      statusFilter = `AND tgb.status IN ('operational', 'assignment_bank')`;
    }

    const sql = `
      SELECT 
        t.id,
        t.name,
        t.status as task_status,
        t.color,
        t."taskGroupId",
        t."team_id",
        tgb.status as task_group_status,
        tg.name as "taskGroupName",
        COUNT(ta.id) as "assignedcount"
      FROM "Tasks" t
      JOIN "TaskGroups" tg ON t."taskGroupId" = tg.id
      JOIN "TaskGroupBatchStatus" tgb ON tg.id = tgb."taskGroupId"
      LEFT JOIN "TaskAssignments" ta ON ta.task_id = t.id AND ta.team_id = :teamId
      WHERE t."deletedAt" IS NULL
        AND tg."deletedAt" IS NULL
        AND tgb."course_batch_id" = :courseBatchId
        AND (t."team_id" = :teamId OR t."team_id" IS NULL)
        ${whereClause}
        ${statusFilter}
      GROUP BY 
        t.id,
        t.name,
        t.status,
        t.color,
        t."taskGroupId",
        t."team_id",
        tgb.status,
        tg.name
      ORDER BY t."createdAt" DESC
    `;

    const results = await sequelize.query(sql, {
      replacements: { ...replacements, courseBatchId, teamId },
      type: sequelize.QueryTypes.SELECT,
    });

    const grouped = {
      operational: results.filter((t) => t.task_group_status === "operational"),
      assignment_bank: results.filter(
        (t) => t.task_group_status === "assignment_bank"
      ),
      archives: results.filter((t) => t.task_group_status === "archives"),
    };

    return res.json({ success: true, data: grouped });
  } catch (error) {
    console.error("Advanced search error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

function buildWhereClause(queryObj, idxObj = { value: 0 }) {
  const conditions = [];
  const replacements = {};
  const nextIdx = () => idxObj.value++;

  if (queryObj.conditions && queryObj.conditions.length > 0) {
    const groupConditions = [];

    queryObj.conditions.forEach((cond) => {
      if (!cond.value) return;
      if (Array.isArray(cond.value) && cond.value.length === 0) return;
      if (typeof cond.value === "string" && !cond.value.trim()) return;

      const currentIdx = nextIdx();

      switch (cond.field) {
        case "search":
          if (cond.operator === "contains") {
            groupConditions.push(`LOWER(t.name) LIKE LOWER(:search${currentIdx})`);
            replacements[`search${currentIdx}`] = `%${cond.value}%`;
          } else {
            groupConditions.push(`LOWER(t.name) = LOWER(:search${currentIdx})`);
            replacements[`search${currentIdx}`] = cond.value;
          }
          break;

        case "color":
          if (Array.isArray(cond.value)) {
            groupConditions.push(`t.color IN (:colors${currentIdx})`);
            replacements[`colors${currentIdx}`] = cond.value;
          } else {
            groupConditions.push(`t.color = :color${currentIdx}`);
            replacements[`color${currentIdx}`] = cond.value;
          }
          break;

        case "tag":
          groupConditions.push(`EXISTS (
            SELECT 1 FROM "TaskTags" tt 
            WHERE tt.task_id = t.id AND tt.tag_id IN (:tags${currentIdx})
          )`);
          replacements[`tags${currentIdx}`] = cond.value;
          break;

        case "gradeStage":
          if (Array.isArray(cond.value)) {
            groupConditions.push(`t."gradeStageId" IN (:gradeStages${currentIdx})`);
            replacements[`gradeStages${currentIdx}`] = cond.value;
          } else {
            groupConditions.push(`t."gradeStageId" = :gradeStage${currentIdx}`);
            replacements[`gradeStage${currentIdx}`] = cond.value;
          }
          break;
      }
    });

    if (groupConditions.length > 0) {
      const logic = queryObj.logic === "OR" ? " OR " : " AND ";
      conditions.push(`(${groupConditions.join(logic)})`);
    }
  }

  if (queryObj.groups && queryObj.groups.length > 0) {
    const nestedWheres = [];

    queryObj.groups.forEach((group) => {
      const { whereClause: nestedClause, replacements: nestedRepl } =
        buildWhereClause(group, idxObj);
      if (nestedClause) {
        // Remove the leading " AND " from recursive result
        const cleanClause = nestedClause.replace(/^\s*AND\s+/i, '');
        Object.assign(replacements, nestedRepl);
        nestedWheres.push(cleanClause);
      }
    });

    if (nestedWheres.length > 0) {
      const logic = queryObj.logic === "OR" ? " OR " : " AND ";
      conditions.push(`(${nestedWheres.join(logic)})`);
    }
  }

  if (conditions.length === 0) {
    return { whereClause: "", replacements };
  }

  const logic = queryObj.logic === "OR" ? " OR " : " AND ";
  return {
    whereClause: ` AND (${conditions.join(logic)})`,
    replacements,
  };
}
