
const {
  Team,
  TaskAssignment,
  Task,
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
  TaskAssignmentOccurrence,
  TaskVisibilityOverride,
  FormSubmission,
} = require("../../models");

const { Op } = require("sequelize");
const { sequelize } = require("../../models/index");
const { QueryTypes } = require("sequelize");
const logger = require("../utils/logger");
const { catchError } = require("../utils/errorHandler");



exports.assignedTeamQueueRange = async (req, res) => {
  try {
    const { teamId, course_batch_id } = req.params;

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

    const sql = `
      SELECT
        t.id AS task_id,
        t.name AS name,
        t.status AS status,
        t."exposure" AS exposure,
        t."recommendedTime" AS "recommendedTime",
        t."notRequiredToSubmit" AS "notRequiredToSubmit",
        t.color AS task_color,
        t."formId" AS "formId",
        t."feedbackId" AS "feedbackId",
        t."surveyId" AS "surveyId",
        tg.name AS group_name,
        tg.id AS group_id,
        a.color AS axis_color,
        
        COUNT(ta.id) AS assignments_count,
        
        json_agg(
          json_build_object(
            'id', ta.id,
            'taskAssignmentId', ta.id,
            'user_id', ta."user_id",
            'memberName', u.name,
            'memberUsername', u.username,
            'createdAt', ta."createdAt",
            'name', t."name",
            'completed', ta."completed",
            'completed_at', ta."completed_at",
            'isQueueTask', ta."isQueueTask",
            'start', ta."start",
            'end', ta."end"
          )
          ORDER BY ta."createdAt" ASC
        ) AS assignments
        
      FROM "TaskAssignments" ta
      JOIN "Tasks" t ON t.id = ta."task_id"
      LEFT JOIN "TaskGroups" tg ON tg.id = t."taskGroupId"
      LEFT JOIN "Axes" a ON a.id = tg."axisId"
      
      JOIN "TeamMembers" tm ON tm.id = ta."user_id"
        AND tm."member_role" = 'STUDENT' 
        AND tm."course_batch_id" = :course_batch_id 
      
      LEFT JOIN "Users" u ON u.id = tm."user_id"
      
      WHERE ta."team_id" = :teamId
        AND ta."isQueueTask" = true
      
      GROUP BY
        t.id, t.name, t.status, t."exposure", t."recommendedTime",
        t."notRequiredToSubmit", t.color, t."formId", t."feedbackId",
        t."surveyId", tg.name, tg.id, a.color
      
      ORDER BY MAX(ta."createdAt") DESC
    `;

    const results = await sequelize.query(sql, {
      replacements: {
        teamId: Number(teamId),
        course_batch_id: Number(course_batch_id),
      },
      type: sequelize.QueryTypes.SELECT,
      raw: true,
    });

    const now = new Date();
    results.forEach((task) => {
      const latestAssignment = task.assignments[task.assignments.length - 1];
      if (latestAssignment && latestAssignment.createdAt) {
        const addedAt = new Date(latestAssignment.createdAt);
        const diffMinutes = Math.floor((now - addedAt) / (1000 * 60));

        if (diffMinutes < 1) {
          task.timeAgo = "עכשיו";
        } else if (diffMinutes < 60) {
          task.timeAgo = `לפני ${diffMinutes} דקות`;
        } else if (diffMinutes < 1440) {
          task.timeAgo = `לפני ${Math.floor(diffMinutes / 60)} שעות`;
        } else {
          task.timeAgo = `לפני ${Math.floor(diffMinutes / 1440)} ימים`;
        }
      }

      task.hasExposure = task.exposure === true;
    });

    // ==========================================
    // 1️⃣ Apply block date filter (for students only)
    // ==========================================
    let filteredResults = results;
    if (!hasSpecialPermission) {
      const blockDatesQuery = `
        SELECT "blockFromDate", "blockToDate"
        FROM "TeamCourseBatches"
        WHERE team_id = :teamId
          AND course_batch_id = :course_batch_id
      `;
      const blockDates = await sequelize.query(blockDatesQuery, {
        replacements: { teamId, course_batch_id },
        type: sequelize.QueryTypes.SELECT,
        raw: true,
      });
      const blockFromDate = blockDates[0]?.blockFromDate;
      const blockToDate = blockDates[0]?.blockToDate;

      if (blockFromDate && blockToDate) {
        const fromDate = new Date(blockFromDate);
        const toDate = new Date(blockToDate);
        filteredResults = results.filter((task) => {
          const firstAssignment = task.assignments?.[0];
          const taskStart = firstAssignment?.start;
          const taskStatus = task.status;
          if (taskStatus === "assignment_bank") {
            return true;
          }
          if (!taskStart) return true;
          const taskStartDate = new Date(taskStart);
          return taskStartDate < fromDate || taskStartDate > toDate;
        });
      }
    }

    // ==========================================
    // 2️⃣ Add Form data to EACH assignment
    // ==========================================
    // איסוף כל ה-formIds הייחודיים
    const allFormIds = [...new Set(
      filteredResults
        .filter((t) => t.formId)
        .map((t) => t.formId)
    )];

    // איסוף כל ה-taskAssignmentIds
    const allAssignmentIds = filteredResults
      .flatMap((t) => t.assignments || [])
      .map((a) => a.taskAssignmentId)
      .filter((id) => id);

    // מיפוי formId -> max_score
    let formQuestionsMap = new Map();
    if (allFormIds.length > 0) {
      const formQuestions = await sequelize.query(
        `
        SELECT form_id, SUM(points) as max_score
        FROM "FormQuestions"
        WHERE form_id IN (:formIds)
        GROUP BY form_id
      `,
        {
          replacements: { formIds: allFormIds },
          type: sequelize.QueryTypes.SELECT,
          raw: true,
        }
      );
      formQuestions.forEach((fq) => {
        formQuestionsMap.set(fq.form_id, parseInt(fq.max_score) || 0);
      });
    }

    // מיפוי task_assignment_id -> form submission
    let formSubmissionsMap = new Map();
    if (allAssignmentIds.length > 0) {
      const formSubmissions = await sequelize.query(
        `
        SELECT DISTINCT ON ("task_assignment_id") 
          "task_assignment_id", score, submitted_at, started_at
        FROM "FormSubmissions"
        WHERE "task_assignment_id" IN (:taskAssignmentIds)
        ORDER BY "task_assignment_id", submitted_at DESC
      `,
        {
          replacements: { taskAssignmentIds: allAssignmentIds },
          type: sequelize.QueryTypes.SELECT,
          raw: true,
        }
      );
      formSubmissions.forEach((fs) => {
        formSubmissionsMap.set(fs.task_assignment_id, fs);
      });
    }

    // הוספת נתוני Form לכל Assignment
    filteredResults.forEach((task) => {
      const maxScore = formQuestionsMap.get(task.formId) || 0;

      if (task.assignments) {
        task.assignments.forEach((assignment) => {
          const submission = formSubmissionsMap.get(assignment.taskAssignmentId);

          assignment.max_score = maxScore;
          assignment.form_score = submission?.score || null;
          assignment.form_completed_at = submission?.submitted_at || null;
          assignment.form_started_at = submission?.started_at || null;
          assignment.scorePercentage =
            submission?.score && maxScore > 0
              ? Number(((submission.score / maxScore) * 100).toFixed(2))
              : null;
        });
      }
    });



    res.status(200).json({ success: true, data: filteredResults });

  } catch (err) {
    catchError(err, req, res, { function: "assignedTeamQueueRange" });
  }
};

exports.assignedTeamQueueRangeByMember = async (req, res) => {
  try {
    const { teamId, course_batch_id, memberId } = req.params;

    const sql = `
      SELECT
        t.id AS task_id,
        t.name AS name,
        t.status AS status,
        t."exposure" AS exposure,
        t."recommendedTime" AS "recommendedTime",
        t."notRequiredToSubmit" AS "notRequiredToSubmit",
        t.color AS task_color,
        t."formId" AS "formId",
        tg.name AS group_name,
        tg.id AS group_id,
        a.color AS axis_color,
        
        COUNT(ta.id) AS assignments_count,
        
        json_agg(
          json_build_object(
            'id', ta.id,
            'taskAssignmentId', ta.id,
            'user_id', ta."user_id",
            'memberName', u.name,
            'memberUsername', u.username,
            'createdAt', ta."createdAt",
            'completed', ta."completed",
            'completed_at', ta."completed_at",
            'isQueueTask', ta."isQueueTask"
          )
          ORDER BY ta."createdAt" ASC
        ) AS assignments
        
      FROM "TaskAssignments" ta
      JOIN "Tasks" t ON t.id = ta."task_id"
      LEFT JOIN "TaskGroups" tg ON tg.id = t."taskGroupId"
      LEFT JOIN "Axes" a ON a.id = tg."axisId"
      
      JOIN "TeamMembers" tm ON tm.id = ta."user_id"
        AND tm."member_role" = 'STUDENT' 
        AND tm."course_batch_id" = :course_batch_id
        AND tm.id = :memberId
      
      LEFT JOIN "Users" u ON u.id = tm."user_id"
      
      WHERE ta."team_id" = :teamId
        AND ta."isQueueTask" = true
      
      GROUP BY
        t.id, t.name, t.status, t."exposure", t."recommendedTime",
        t."notRequiredToSubmit", t.color, t."formId",
        tg.name, tg.id, a.color
      
      ORDER BY MAX(ta."createdAt") DESC
    `;

    const results = await sequelize.query(sql, {
      replacements: {
        teamId: Number(teamId),
        course_batch_id: Number(course_batch_id),
        memberId: Number(memberId),
      },
      type: sequelize.QueryTypes.SELECT,
      raw: true,
    });

    // חישוב timeAgo
    const now = new Date();
    results.forEach((task) => {
      const latestAssignment = task.assignments[task.assignments.length - 1];
      if (latestAssignment && latestAssignment.createdAt) {
        const addedAt = new Date(latestAssignment.createdAt);
        const diffMinutes = Math.floor((now - addedAt) / (1000 * 60));

        if (diffMinutes < 1) {
          task.timeAgo = 'עכשיו';
        } else if (diffMinutes < 60) {
          task.timeAgo = `לפני ${diffMinutes} דקות`;
        } else if (diffMinutes < 1440) {
          task.timeAgo = `לפני ${Math.floor(diffMinutes / 60)} שעות`;
        } else {
          task.timeAgo = `לפני ${Math.floor(diffMinutes / 1440)} ימים`;
        }
      }

      task.hasExposure = task.exposure === true;
    });

    // ==========================================
    // Add Form data
    // ==========================================

    const allFormIds = [...new Set(
      results
        .filter((t) => t.formId)
        .map((t) => t.formId)
    )];

    const allAssignmentIds = results
      .flatMap((t) => t.assignments || [])
      .map((a) => a.taskAssignmentId)
      .filter((id) => id);

    let formQuestionsMap = new Map();
    if (allFormIds.length > 0) {
      const formQuestions = await sequelize.query(
        `
        SELECT form_id, SUM(points) as max_score
        FROM "FormQuestions"
        WHERE form_id IN (:formIds)
        GROUP BY form_id
      `,
        {
          replacements: { formIds: allFormIds },
          type: sequelize.QueryTypes.SELECT,
          raw: true,
        }
      );
      formQuestions.forEach((fq) => {
        formQuestionsMap.set(fq.form_id, parseInt(fq.max_score) || 0);
      });
    }

    let formSubmissionsMap = new Map();
    if (allAssignmentIds.length > 0) {
      const formSubmissions = await sequelize.query(
        `
        SELECT DISTINCT ON ("task_assignment_id") 
          "task_assignment_id", score, submitted_at, started_at
        FROM "FormSubmissions"
        WHERE "task_assignment_id" IN (:taskAssignmentIds)
        ORDER BY "task_assignment_id", submitted_at DESC
      `,
        {
          replacements: { taskAssignmentIds: allAssignmentIds },
          type: sequelize.QueryTypes.SELECT,
          raw: true,
        }
      );
      formSubmissions.forEach((fs) => {
        formSubmissionsMap.set(fs.task_assignment_id, fs);
      });
    }

    results.forEach((task) => {
      const maxScore = formQuestionsMap.get(task.formId) || 0;

      if (task.assignments) {
        task.assignments.forEach((assignment) => {
          const submission = formSubmissionsMap.get(assignment.taskAssignmentId);

          assignment.max_score = maxScore;
          assignment.form_score = submission?.score || null;
          assignment.form_completed_at = submission?.submitted_at || null;
          assignment.form_started_at = submission?.started_at || null;
          assignment.scorePercentage =
            submission?.score && maxScore > 0
              ? Number(((submission.score / maxScore) * 100).toFixed(2))
              : null;
        });
      }
    });

    res.status(200).json({ success: true, data: results });
  } catch (err) {
    catchError(err, req, res, { function: "assignedTeamQueueRangeByMember" });
  }
};

exports.getQueueTasksByMemberFlat = async (req, res) => {
  try {
    const { teamId, course_batch_id, memberId } = req.params;
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

    const sql = `
      SELECT
        t.id AS task_id,
        t.name AS name,
        t.status AS status,
        t."exposure" AS exposure,
        t."recommendedTime" AS "recommendedTime",
        t."notRequiredToSubmit" AS "notRequiredToSubmit",
        t.color AS color,
        t."formId" AS "formId",
        tg.name AS group_name,
        tg.id AS group_id,
        a.color AS axis_color,
        
        json_agg(
          json_build_object(
            'id', ta.id,
            'taskAssignmentId', ta.id,
            'user_id', ta."user_id",
            'memberName', u.name,
            'memberUsername', u.username,
            'createdAt', ta."createdAt",
            'completed', ta."completed",
            'completed_at', ta."completed_at",
            'isQueueTask', ta."isQueueTask"
          )
          ORDER BY ta."createdAt" ASC
        ) AS assignments
        
      FROM "TaskAssignments" ta
      JOIN "Tasks" t ON t.id = ta."task_id"
      LEFT JOIN "TaskGroups" tg ON tg.id = t."taskGroupId"
      LEFT JOIN "Axes" a ON a.id = tg."axisId"
      
      JOIN "TeamMembers" tm ON tm.id = ta."user_id"
        AND tm."member_role" = 'STUDENT' 
        AND tm."course_batch_id" = :course_batch_id
        AND tm.id = :memberId
      
      LEFT JOIN "Users" u ON u.id = tm."user_id"
      
      WHERE ta."team_id" = :teamId
        AND ta."isQueueTask" = true
      
      GROUP BY
        t.id, t.name, t.status, t."exposure", t."recommendedTime",
        t."notRequiredToSubmit", t.color, t."formId",
        tg.name, tg.id, a.color
      
      ORDER BY MAX(ta."createdAt") DESC
    `;

    const results = await sequelize.query(sql, {
      replacements: {
        teamId: Number(teamId),
        course_batch_id: Number(course_batch_id),
        memberId: Number(memberId),
      },
      type: sequelize.QueryTypes.SELECT,
      raw: true,
    });

    if (!results || results.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const allFormIds = [...new Set(
      results
        .filter((t) => t.formId)
        .map((t) => t.formId)
    )];

    const allAssignmentIds = results
      .flatMap((t) => t.assignments || [])
      .map((a) => a.taskAssignmentId)
      .filter((id) => id);

    let formQuestionsMap = new Map();
    if (allFormIds.length > 0) {
      const formQuestions = await sequelize.query(
        `SELECT form_id, SUM(points) as max_score
         FROM "FormQuestions"
         WHERE form_id IN (:formIds)
         GROUP BY form_id`,
        {
          replacements: { formIds: allFormIds },
          type: sequelize.QueryTypes.SELECT,
          raw: true,
        }
      );
      formQuestions.forEach((fq) => {
        formQuestionsMap.set(fq.form_id, parseInt(fq.max_score) || 0);
      });
    }

    let formSubmissionsMap = new Map();
    if (allAssignmentIds.length > 0) {
      const formSubmissions = await sequelize.query(
        `SELECT DISTINCT ON ("task_assignment_id") 
           "task_assignment_id", score, submitted_at, started_at
         FROM "FormSubmissions"
         WHERE "task_assignment_id" IN (:taskAssignmentIds)
         ORDER BY "task_assignment_id", submitted_at DESC`,
        {
          replacements: { taskAssignmentIds: allAssignmentIds },
          type: sequelize.QueryTypes.SELECT,
          raw: true,
        }
      );
      formSubmissions.forEach((fs) => {
        formSubmissionsMap.set(fs.task_assignment_id, fs);
      });
    }

    const flatTasks = [];

    results.forEach((task) => {
      const maxScore = formQuestionsMap.get(task.formId) || 0;
      const taskId = task.task_id;
      const taskName = task.name;
      const taskColor = task.color;
      const groupName = task.group_name;
      const notRequiredToSubmit = task.notRequiredToSubmit;
      const exposure = task.exposure;
      const formId = task.formId;

      if (task.assignments && task.assignments.length > 0) {
        task.assignments.forEach((assignment, index) => {
          const submission = formSubmissionsMap.get(assignment.taskAssignmentId);

          flatTasks.push({
            id: assignment.taskAssignmentId,
            taskId: taskId,
            name: taskName,
            status: task.status,
            color: taskColor,
            group_name: groupName,
            axis_color: task.axis_color,
            exposure: exposure,
            recommendedTime: task.recommendedTime,
            notRequiredToSubmit: notRequiredToSubmit,
            formId: formId,
            feedbackId: null,

            completed: assignment.completed,
            completed_at: assignment.completed_at,
            assigned: assignment.createdAt || new Date().toISOString(),
            start: assignment.createdAt || new Date().toISOString(),
            end: assignment.createdAt ? new Date(new Date(assignment.createdAt).getTime() + 60 * 60 * 1000).toISOString() : new Date().toISOString(),

            taskassignmentid: assignment.taskAssignmentId,
            max_score: maxScore,
            form_score: submission?.score || null,
            form_completed_at: submission?.submitted_at || null,
            form_started_at: submission?.started_at || null,
            scorePercentage:
              submission?.score && maxScore > 0
                ? Number(((submission.score / maxScore) * 100).toFixed(2))
                : null,

            isQueueTask: true,

            memberName: assignment.memberName,
            has_queue_task: true,
          });
        });
      }
    });

    res.status(200).json({ success: true, data: flatTasks });

  } catch (err) {
    catchError(err, req, res, { function: "queue.getQueueTasksByMemberFlat" });
  }
};