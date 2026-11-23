// controllers/taskAssignmentHoef.controller.js
"use strict";
const {
  TaskAssignmentHofef,
  TeamMember,
  User,
  TaskAssignment,
} = require("../../models");
const { Op } = require("sequelize");
const { sequelize } = require("../../models/index");
const logger = require("../utils/logger");
const { catchError } = require("../utils/errorHandler");
// ==========================================
// 📋 קבלת כל החופפים למשימה ספציפית
// ==========================================
exports.getHoefsByTaskAssignment = async (req, res) => {
  try {
    const { taskAssignmentId } = req.params;
    // 🆕 שימוש ב-raw query במקום include
    const hoefs = await sequelize.query(
      `
      SELECT 
        tah.id,
        tah.task_assignment_id,
        tah.team_member_id,
        tah.deadline,
        tm.id as "tmId",
        tm.user_id as "tmUserId",
        tm.member_role,
        tm.team_id,
        u.id as "userId",
        u.name as "userName"
      FROM "TaskAssignmentHofefs" tah
      JOIN "TeamMembers" tm ON tm.id = tah.team_member_id
      JOIN "Users" u ON u.id = tm.user_id
      WHERE tah.task_assignment_id = :taskAssignmentId
      ORDER BY tah.deadline ASC NULLS LAST
      `,
      {
        replacements: { taskAssignmentId },
        type: sequelize.QueryTypes.SELECT,
        raw: true,
      }
    );
    // המרה לפורמט הנכון
    const formattedHoefs = hoefs.map((h) => ({
      id: h.id,
      task_assignment_id: h.task_assignment_id,
      team_member_id: h.team_member_id,
      deadline: h.deadline,
      created_at: h.created_at,
      updated_at: h.updated_at,
      TeamMember: {
        id: h.tmId,
        user_id: h.tmUserId,
        member_role: h.member_role,
        team_id: h.team_id,
        user: {
          id: h.userId,
          name: h.userName,
        },
      },
    }));
    res.status(200).json({
      success: true,
      data: formattedHoefs,
    });
  } catch (error) {
    catchError(error, req, res, { function: "taskAssignmentHoef.getHoefsByTaskAssignment" });
  }
};
// ==========================================
// 🎯 קבלת כל החופפים של משתמש (כחופף)
// ==========================================
exports.getHoefsByUser = async (req, res) => {
  try {
    const { teamMemberId } = req.params;
    const hoefs = await sequelize.query(
      `
      SELECT 
        tah.id,
        tah.task_assignment_id,
        tah.team_member_id,
        tah.deadline,
        ta.id as "taId",
        ta.task_id,
        ta.user_id as "taUserId",
        ta.start as "taStart",
        ta.end as "taEnd",
        ta.completed,
        ta.completed_at,
        t.name as "taskName",
        t.color as "taskColor",
        t.status as "taskStatus",
        tm.id as "tmId",
        tm.user_id as "tmUserId",
        tm.member_role,
        u.id as "userId",
        u.name as "userName"
      FROM "TaskAssignmentHofefs" tah
      JOIN "TaskAssignments" ta ON ta.id = tah.task_assignment_id
      JOIN "Tasks" t ON t.id = ta.task_id
      JOIN "TeamMembers" tm ON tm.id = ta.user_id
      JOIN "Users" u ON u.id = tm.user_id
      WHERE tah.team_member_id = :teamMemberId
      ORDER BY tah.deadline ASC NULLS LAST
      `,
      {
        replacements: { teamMemberId },
        type: sequelize.QueryTypes.SELECT,
        raw: true,
      }
    );
    // המרה לפורמט הנכון
    const formattedHoefs = hoefs.map((h) => ({
      id: h.id,
      task_assignment_id: h.task_assignment_id,
      team_member_id: h.team_member_id,
      deadline: h.deadline,
      created_at: h.created_at,
      updated_at: h.updated_at,
      TaskAssignment: {
        id: h.taId,
        task_id: h.task_id,
        user_id: h.taUserId,
        start: h.taStart,
        end: h.taEnd,
        completed: h.completed,
        completed_at: h.completed_at,
        Task: {
          id: h.task_id,
          name: h.taskName,
          color: h.taskColor,
          status: h.taskStatus,
        },
        TeamMember: {
          id: h.tmId,
          user_id: h.tmUserId,
          member_role: h.member_role,
          user: {
            id: h.userId,
            name: h.userName,
          },
        },
      },
    }));
    res.status(200).json({
      success: true,
      data: formattedHoefs,
    });
  } catch (error) {
    catchError(error, req, res, { function: "taskAssignmentHoef.getHoefsByUser" });
  }
};
// ==========================================
// 📊 קבלת חופפים עם סטטוס (פגי תוקף, קרובים, וכו')
// ==========================================
exports.getHoefTasksWithStatus = async (req, res) => {
  try {
    const { teamMemberId } = req.params;
    const { status } = req.query;
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    let whereClause = "";
    let replacements = { teamMemberId };
    if (status === "overdue") {
      whereClause = "AND tah.deadline < :now";
      replacements.now = now;
    } else if (status === "upcoming") {
      whereClause = "AND tah.deadline >= :now AND tah.deadline <= :nextWeek";
      replacements.now = now;
      replacements.nextWeek = nextWeek;
    } else if (status === "no_deadline") {
      whereClause = "AND tah.deadline IS NULL";
    }
    const hoefs = await sequelize.query(
      `
      SELECT 
        tah.id,
        tah.task_assignment_id,
        tah.team_member_id,
        tah.deadline,
        ta.id as "taId",
        ta.task_id,
        ta.start as "taStart",
        ta.end as "taEnd",
        t.name as "taskName",
        t.color as "taskColor"
      FROM "TaskAssignmentHofefs" tah
      JOIN "TaskAssignments" ta ON ta.id = tah.task_assignment_id
      JOIN "Tasks" t ON t.id = ta.task_id
      WHERE tah.team_member_id = :teamMemberId
      ${whereClause}
      ORDER BY tah.deadline ASC NULLS LAST
      `,
      {
        replacements,
        type: sequelize.QueryTypes.SELECT,
        raw: true,
      }
    );
    // הוספת סטטוס וימים לכל רשומה
    const hoefsWithStatus = hoefs.map((hoef) => {
      const data = { ...hoef };
      let computedStatus = "no_deadline";
      if (hoef.deadline) {
        const deadline = new Date(hoef.deadline);
        if (deadline < now) {
          computedStatus = "overdue";
        } else if (deadline <= nextWeek) {
          computedStatus = "upcoming";
        } else {
          computedStatus = "ok";
        }
        data.daysUntilDeadline = Math.ceil(
          (deadline - now) / (1000 * 60 * 60 * 24)
        );
      } else {
        data.daysUntilDeadline = null;
      }
      data.computedStatus = computedStatus;
      return data;
    });
    res.status(200).json({
      success: true,
      data: hoefsWithStatus,
    });
  } catch (error) {
    catchError(error, req, res, { function: "taskAssignmentHoef.getHoefTasksWithStatus" });
  }
};
// ==========================================
// ➕ שמירת/עדכון חופפים למשימה
// ==========================================
exports.saveHoefsForTask = async (req, res) => {
  try {
    const { taskAssignmentId } = req.params;
    const { hoefs } = req.body;

    if (!Array.isArray(hoefs)) {
      return res.status(400).json({
        success: false,
        message: "hoefs חייב להיות מערך",
      });
    }
    // מחיקת כל החופפים הקיימים למשימה זו
    await TaskAssignmentHofef.destroy({
      where: { task_assignment_id: taskAssignmentId },
    });
    // הוספת החופפים החדשים
    if (hoefs.length > 0) {
      const hoefsToCreate = hoefs.map((h) => ({
        task_assignment_id: taskAssignmentId,
        team_member_id: h.team_member_id,
        deadline: h.deadline || null,
      }));
      await TaskAssignmentHofef.bulkCreate(hoefsToCreate);
    }
    // שליפת החופפים שנשמרו
    const savedHoefs = await sequelize.query(
      `
      SELECT 
        tah.id,
        tah.task_assignment_id,
        tah.team_member_id,
        tah.deadline,
        u.id as "userId",
        u.name as "userName"
     
      FROM "TaskAssignmentHofefs" tah
      JOIN "TeamMembers" tm ON tm.id = tah.team_member_id
      JOIN "Users" u ON u.id = tm.user_id
      WHERE tah.task_assignment_id = :taskAssignmentId
      ORDER BY tah.deadline ASC NULLS LAST
      `,
      {
        replacements: { taskAssignmentId },
        type: sequelize.QueryTypes.SELECT,
        raw: true,
      }
    );

    logger.info("TaskAssignmentHoefs saved", {
      taskAssignmentId: Number(taskAssignmentId),
      hoefsCount: hoefs.length,
      savedCount: savedHoefs.length,
      userId: req.headers["x-user-id"],
    });
    res.status(200).json({
      success: true,
      message: "החופפים נשמרו בהצלחה",
      data: savedHoefs,
    });
  } catch (error) {
    catchError(error, req, res, { function: "taskAssignmentHoef.saveHoefsForTask" });
  }
};
// ==========================================
// ➕ הוספת חופף בודד
// ==========================================
exports.addHoef = async (req, res) => {
  try {
    const { taskAssignmentId } = req.params;
    const { team_member_id, deadline } = req.body;
    if (!team_member_id) {
      return res.status(400).json({
        success: false,
        message: "team_member_id הוא שדה חובה",
      });
    }
    // בדיקה אם כבר קיים
    const existing = await TaskAssignmentHofef.findOne({
      where: {
        task_assignment_id: taskAssignmentId,
        team_member_id,
      },
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "חופף זה כבר קיים במשימה",
      });
    }
    const hoef = await TaskAssignmentHofef.create({
      task_assignment_id: taskAssignmentId,
      team_member_id,
      deadline: deadline || null,
    });

    logger.info("TaskAssignmentHoef created", {
      hoefId: hoef.id,
      taskAssignmentId: Number(taskAssignmentId),
      teamMemberId: team_member_id,
      deadline: deadline,
      userId: req.headers["x-user-id"],
    });
    res.status(201).json({
      success: true,
      message: "החופף נוסף בהצלחה",
      data: hoef,
    });
  } catch (error) {
    catchError(error, req, res, { function: "taskAssignmentHoef.addHoef" });
  }
};
// ==========================================
// ✏️ עדכון דדליין של חופף
// ==========================================
exports.updateHoefDeadline = async (req, res) => {
  try {
    const { id } = req.params;
    const { deadline } = req.body;

    const hoef = await TaskAssignmentHofef.findByPk(id);
    if (!hoef) {
      return res.status(404).json({
        success: false,
        message: "החופף לא נמצא",
      });
    }
    hoef.deadline = deadline || null;
    await hoef.save();

    logger.info("TaskAssignmentHoef deadline updated", {
      hoefId: id,
      // previousDeadline: previousDeadline,
      newDeadline: deadline,
      userId: req.headers["x-user-id"],
    });
    res.status(200).json({
      success: true,
      message: "הדדליין עודכן בהצלחה",
      data: hoef,
    });
  } catch (error) {
    catchError(error, req, res, { function: "taskAssignmentHoef.updateHoefDeadline" });
  }
};
// ==========================================
// 🗑️ מחיקת חופף
// ==========================================
exports.deleteHoef = async (req, res) => {
  try {
    const { id } = req.params;
    const hoef = await TaskAssignmentHofef.findByPk(id);
    if (!hoef) {
      return res.status(404).json({
        success: false,
        message: "החופף לא נמצא",
      });
    }

    logger.info("TaskAssignmentHoef deleted", {
      hoefId: id,
      taskAssignmentId: hoef.task_assignment_id,
      teamMemberId: hoef.team_member_id,
      userId: req.headers["x-user-id"],
    });
    await hoef.destroy();
    res.status(200).json({
      success: true,
      message: "החופף נמחק בהצלחה",
    });
  } catch (error) {
    catchError(error, req, res, { function: "taskAssignmentHoef.deleteHoef" });
  }
};
// ==========================================
// 📋 קבלת חופפים זמינים להוספה (לא משויכים למשימה)
// ==========================================
exports.getAvailableHoefs = async (req, res) => {
  try {
    const { taskAssignmentId } = req.params;
    // קבלת ה-TaskAssignment כדי לדעת את ה-team_id
    const taskAssignment = await TaskAssignment.findByPk(taskAssignmentId);
    if (!taskAssignment) {
      return res.status(404).json({
        success: false,
        message: "המשימה לא נמצאה",
      });
    }
    // שליפת חופפים זמינים
    const availableHoefs = await sequelize.query(
      `
      SELECT 
        tm.id,
        tm.user_id,
        tm.member_role,
        tm.team_id,
        u.id as "userId",
        u.name as "userName"
      FROM "TeamMembers" tm
      JOIN "Users" u ON u.id = tm.user_id
      WHERE tm.team_id = :teamId
        AND tm.member_role = 'OVERLAP'
        AND tm.id NOT IN (
          SELECT team_member_id 
          FROM "TaskAssignmentHofefs" 
          WHERE task_assignment_id = :taskAssignmentId
        )
      ORDER BY u.name
      `,
      {
        replacements: {
          teamId: taskAssignment.team_id,
          taskAssignmentId,
        },
        type: sequelize.QueryTypes.SELECT,
        raw: true,
      }
    );
    // המרה לפורמט הנכון
    const formattedHoefs = availableHoefs.map((hoef) => ({
      id: hoef.id,
      user_id: hoef.user_id,
      member_role: hoef.member_role,
      team_id: hoef.team_id,
      user: {
        id: hoef.userId,
        name: hoef.userName,
      },
    }));
    res.status(200).json({
      success: true,
      data: formattedHoefs,
    });
  } catch (error) {
    catchError(error, req, res, { function: "taskAssignmentHoef.getAvailableHoefs" });
  }
};

// controllers/taskAssignmentHoef.controller.js
// ==========================================
// 📋 קבלת כל החופפים של הצוות (כולל אלה ללא משימות)
// ==========================================
exports.getAllHoefsByTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const hoefsData = await sequelize.query(
      `
      SELECT 
        tm.id as hoef_member_id,
        tm.user_id as hoef_user_id,
        u_hoef.name as hoef_name,
        u_hoef.username as hoef_username,
        tm.member_role,
        tah.id as hoef_assignment_id,
        tah.task_assignment_id,
        tah.deadline,
    
        t.id as task_id,
        t.name as task_name,
        t.color as task_color,
        t.status as task_status,
        t."feedbackId" as task_feedback_id,
        t."formId" as task_form_id,
        t."recommendedTime" as task_recommended_time,
        t."notRequiredToCheck" as not_required_to_check,
        ta.id as ta_id,
        ta.completed,
        ta.completed_at as "completed_at",
        ta.start as task_start,
        ta.end as task_end,
        
        ta.user_id as assigned_member_id,
        u_assigned.id as assigned_user_id,
        u_assigned.name as assigned_user_name,
        tm_assigned.member_role as assigned_member_role
      FROM "TeamMembers" tm
      JOIN "Users" u_hoef ON u_hoef.id = tm.user_id
      LEFT JOIN "TaskAssignmentHofefs" tah ON tah.team_member_id = tm.id
      LEFT JOIN "TaskAssignments" ta ON ta.id = tah.task_assignment_id
      LEFT JOIN "Tasks" t ON t.id = ta.task_id
      LEFT JOIN "TeamMembers" tm_assigned ON tm_assigned.id = ta.user_id
      LEFT JOIN "Users" u_assigned ON u_assigned.id = tm_assigned.user_id
      
      WHERE tm.team_id = :teamId
        AND tm.member_role IN ('OVERLAP', 'TEAM_COMMANDER')
      ORDER BY 
        tm.member_role ASC,
        u_hoef.name ASC, 
        tah.deadline ASC NULLS LAST
      `,
      {
        replacements: { teamId },
        type: sequelize.QueryTypes.SELECT,
        raw: true,
      }
    );

    const allTaskAssignmentIds = [...new Set(
      hoefsData
        .filter((h) => h.task_assignment_id)
        .map((h) => h.task_assignment_id)
    )];

    const allFormIds = [...new Set(
      hoefsData
        .filter((h) => h.task_form_id)
        .map((h) => h.task_form_id)
    )];

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
    if (allTaskAssignmentIds.length > 0) {
      const formSubmissions = await sequelize.query(
        `
        SELECT DISTINCT ON ("task_assignment_id") 
          "task_assignment_id", score, submitted_at, started_at
        FROM "FormSubmissions"
        WHERE "task_assignment_id" IN (:taskAssignmentIds)
        ORDER BY "task_assignment_id", submitted_at DESC
      `,
        {
          replacements: { taskAssignmentIds: allTaskAssignmentIds },
          type: sequelize.QueryTypes.SELECT,
          raw: true,
        }
      );
      formSubmissions.forEach((fs) => {
        formSubmissionsMap.set(fs.task_assignment_id, fs);
      });
    }

    let feedbackAnswersMap = new Map();
    if (allTaskAssignmentIds.length > 0) {
      const feedbackAnswers = await sequelize.query(
        `
        SELECT DISTINCT ON (task_assignment_id) 
          task_assignment_id, 
          id as feedback_answer_id,
          feedback_id,
          text_comment,
          summary_grade,
          "selectedOptionLabel"
        FROM "FeedbackAnswers"
        WHERE task_assignment_id IN (:taskAssignmentIds)
        ORDER BY task_assignment_id, id DESC
      `,
        {
          replacements: { taskAssignmentIds: allTaskAssignmentIds },
          type: sequelize.QueryTypes.SELECT,
          raw: true,
        }
      );
      feedbackAnswers.forEach((fa) => {
        feedbackAnswersMap.set(fa.task_assignment_id, fa);
      });
    }

    const memberMap = new Map();
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    hoefsData.forEach((row) => {
      if (!memberMap.has(row.hoef_member_id)) {
        memberMap.set(row.hoef_member_id, {
          id: row.hoef_assignment_id,
          hoef_member_id: row.hoef_member_id,
          hoef_user_id: row.hoef_user_id,
          name: row.hoef_name,
          userName: row.hoef_username,
          member_role: row.member_role,
          tasks: [],
          stats: {
            total: 0,
            overdue: 0,
            upcoming: 0,
            noDeadline: 0,
            completed: 0,
            completionRate: 0,
          },
        });
      }

      const member = memberMap.get(row.hoef_member_id);

      if (row.task_assignment_id && row.task_id) {
        let status = "no_deadline";
        let daysUntilDeadline = null;

        if (row.deadline) {
          const deadline = new Date(row.deadline);
          if (deadline < now) {
            status = "overdue";
            daysUntilDeadline = Math.ceil(
              (now - deadline) / (1000 * 60 * 60 * 24)
            );
          } else if (deadline <= nextWeek) {
            status = "upcoming";
            daysUntilDeadline = Math.ceil(
              (deadline - now) / (1000 * 60 * 60 * 24)
            );
          } else {
            status = "ok";
            daysUntilDeadline = Math.ceil(
              (deadline - now) / (1000 * 60 * 60 * 24)
            );
          }
        }

        // ═══════════════════════════════════════════════════════
        // 🆕 הוספת נתוני Form ו-Feedback למשימה
        // ═══════════════════════════════════════════════════════
        const taskAssignmentId = row.task_assignment_id;
        const formId = row.task_form_id;
        const maxScore = formQuestionsMap.get(formId) || 0;
        const submission = formSubmissionsMap.get(taskAssignmentId);
        const feedbackAnswer = feedbackAnswersMap.get(taskAssignmentId);

        member.tasks.push({
          id: row.hoef_assignment_id,
          task_assignment_id: row.task_assignment_id,
          task_id: row.task_id,
          task_name: row.task_name,
          task_color: row.task_color,
          task_status: row.task_status,
          task_feedback: row.task_feedback_id,
          notRequiredToCheck: row.not_required_to_check,
          deadline: row.deadline,
          completed: row.completed,
          completed_at: row.completed_at,
          daysUntilDeadline,
          status,
          taskRecommendedTime: row.task_recommended_time,
          assignedTo: {
            member_id: row.assigned_member_id,
            user_id: row.assigned_user_id,
            user_name: row.assigned_user_name,
            member_role: row.assigned_member_role,
          },
          // 🆕 שדות Form
          formId: formId || null,
          form_score: submission?.score || null,
          form_completed_at: submission?.submitted_at || null,
          form_started_at: submission?.started_at || null,
          max_score: maxScore,
          scorePercentage:
            submission?.score && maxScore > 0
              ? Number(((submission.score / maxScore) * 100).toFixed(2))
              : null,
          // 🆕 שדות Feedback
          feedback: {
            has_feedback: !!feedbackAnswer,
            feedback_answered: !!feedbackAnswer,
            feedback_answer_id: feedbackAnswer?.feedback_answer_id || null,
            feedback_id: feedbackAnswer?.feedback_id || null,
            text_comment: feedbackAnswer?.text_comment || null,
            summary_grade: feedbackAnswer?.summary_grade || null,
            selectedOptionLabel: feedbackAnswer?.selectedOptionLabel || null,
          },
        });

        member.stats.total++;
        if (status === "overdue") member.stats.overdue++;
        else if (status === "upcoming") member.stats.upcoming++;
        else if (status === "no_deadline") member.stats.noDeadline++;
        if (row.completed) member.stats.completed++;
      }
    });

    // חישוב אחוז השלמה
    memberMap.forEach((member) => {
      member.stats.completionRate =
        member.stats.total > 0
          ? Math.round((member.stats.completed / member.stats.total) * 100)
          : 0;
    });

    const memberSummaries = Array.from(memberMap.values());
    res.status(200).json({
      success: true,
      data: memberSummaries,
    });
  } catch (error) {
    catchError(error, req, res, { function: "taskAssignmentHoef.getAllHoefsByTeam" });
  }
};
exports.getAllTeamTasks = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { includeAssigned } = req.query;
    let whereClause = "";
    let replacements = { teamId };
    if (includeAssigned === "false") {
      whereClause = `
        AND ta.id NOT IN (
          SELECT DISTINCT task_assignment_id 
          FROM "TaskAssignmentHofefs"
        )
      `;
    }
    const tasks = await sequelize.query(
      `
      SELECT 
        ta.id as task_assignment_id,
        ta.task_id,
        tm.id as member_id,
        tm.user_id as user_id,
        u.name as user_name,
        tm.member_role,
        ta.start as task_start,
        ta.end as task_end,
        ta.completed as task_completed,
        ta.completed_at,
        t.name as task_name,
        t.color as task_color,
        t.status as task_status,
        t."feedbackId" as "feedbackId",
        t.description as task_description,
        t."formId" as "formId",
        t."recommendedTime" as "recommendedTime",
        t."notRequiredToCheck" as not_required_to_check,
        tg.id as task_group_id,
        tg.name as task_group_name,
        tg.status as task_group_status,
        a.id as axis_id,
        a.name as axis_name,
        a.color as axis_color,
        a.repository_kind as axis_repository_kind,
        
        -- ספירת חופפים
        (
          SELECT COUNT(*) 
          FROM "TaskAssignmentHofefs" tah2 
          WHERE tah2.task_assignment_id = ta.id
        ) as hoef_count,
        
        -- 🆕 רשימת החופפים
        (
          SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'member_id', tah3.team_member_id,
              'user_id', u3.id,
              'user_name', u3.name
            )
          )
          FROM "TaskAssignmentHofefs" tah3
          JOIN "TeamMembers" tm3 ON tm3.id = tah3.team_member_id
          JOIN "Users" u3 ON u3.id = tm3.user_id
          WHERE tah3.task_assignment_id = ta.id
        ) as hoefs_list

      FROM "TaskAssignments" ta
      JOIN "Tasks" t ON t.id = ta.task_id
      JOIN "TaskGroups" tg ON tg.id = t."taskGroupId"      
      JOIN "Axes" a ON a.id = tg."axisId"
      LEFT JOIN "TeamMembers" tm ON tm.id = ta.user_id
      LEFT JOIN "Users" u ON u.id = tm.user_id
      WHERE tm.team_id = :teamId
        AND tm.member_role != 'OVERLAP'
        ${whereClause}
      ORDER BY t.name ASC
      `,
      {
        replacements,
        type: sequelize.QueryTypes.SELECT,
        raw: true,
      }
    );

    const taskAssignmentIds = tasks
      .map((t) => t?.task_assignment_id)
      .filter((id) => id);
    const taskFormIds = tasks.filter((t) => t.formId).map((t) => t.formId);

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

    let feedbackAnswersMap = new Map();
    if (taskAssignmentIds.length > 0) {
      const feedbackAnswers = await sequelize.query(
        `
        SELECT DISTINCT ON (task_assignment_id) 
          task_assignment_id, 
          id as feedback_answer_id,
          feedback_id,
          text_comment,
          summary_grade
        FROM "FeedbackAnswers"
        WHERE task_assignment_id IN (:taskAssignmentIds)
        ORDER BY task_assignment_id, id DESC
      `,
        {
          replacements: { taskAssignmentIds },
          type: sequelize.QueryTypes.SELECT,
          raw: true,
        }
      );
      feedbackAnswers.forEach((fa) => {
        feedbackAnswersMap.set(fa.task_assignment_id, fa);
      });
    }

    const formattedTasks = tasks.map((task) => {
     
      const formId = task.formId;
      const maxScore = formQuestionsMap.get(formId) || 0;
      const submission = formSubmissionsMap.get(task.task_assignment_id);
      const feedbackAnswer = feedbackAnswersMap.get(task.task_assignment_id);
      const feedback_answered = !!feedbackAnswer;

      let hoefs = [];
      if (task.hoefs_list) {
        try {
          hoefs = task.hoefs_list || [];
        } catch (e) {
          hoefs = [];
        }
      }

      return {
        id: task.task_assignment_id,
        task_assignment_id: task.task_assignment_id,
        taskRecommendedTime: task.recommendedTime,
        task_id: task.task_id,
        task_name: task.task_name,
        task_color: task.task_color,
        task_status: task.task_status,
        task_feedback: task.feedbackId,
        notRequiredToCheck: task.not_required_to_check,
        task_start: task.task_start,
        task_end: task.task_end,
        task_completed: task.task_completed,
        task_completed_at: task.completed_at,
        task_description: task.task_description,
        hoef_count: parseInt(task.hoef_count) || 0,
        has_hoefs: parseInt(task.hoef_count) > 0,
        hoefs: hoefs, 
        taskGroup: {
          id: task.task_group_id,
          name: task.task_group_name,
          status: task.task_group_status,
        },

        axis: {
          id: task.axis_id,
          name: task.axis_name,
          color: task.axis_color,
          repository_kind: task.axis_repository_kind,
        },

        assignedTo: {
          member_id: task.member_id,
          user_id: task.user_id,
          user_name: task.user_name,
          member_role: task.member_role,
        },

        formId: task.formId || null,
        form_score: submission?.score || null,
        form_completed_at: submission?.submitted_at || null,
        form_started_at: submission?.started_at || null,
        max_score: maxScore,
        scorePercentage:
          submission?.score && maxScore > 0
            ? Number(((submission.score / maxScore) * 100).toFixed(2))
            : null,

        feedback: {
          has_feedback: !!feedbackAnswer,
          feedback_answered: feedback_answered,
          feedback_answer_id: feedbackAnswer?.feedback_answer_id || null,
          feedback_id: feedbackAnswer?.feedback_id || null,
          text_comment: feedbackAnswer?.text_comment || null,
          summary_grade: feedbackAnswer?.summary_grade || null,
          selectedOptionLabel: feedbackAnswer?.selectedOptionLabel || null,
        },
      };
    });
    
    res.status(200).json({
      success: true,
      data: formattedTasks,
    });
  } catch (error) {
    catchError(error, req, res, { function: "taskAssignmentHoef.getAllTeamTasks" });
  }
};
exports.removeHoefFromTask = async (req, res) => {
  try {
    const { taskAssignmentId } = req.params;
    const { team_member_id } = req.body;
    if (!team_member_id) {
      return res.status(400).json({
        success: false,
        message: "team_member_id הוא שדה חובה",
      });
    }
    const result = await TaskAssignmentHofef.destroy({
      where: {
        task_assignment_id: taskAssignmentId,
        team_member_id: team_member_id,
      },
    });
    if (result === 0) {
      return res.status(404).json({
        success: false,
        message: "החופף לא נמצא במשימה זו",
      });
    }

    logger.info("TaskAssignmentHoef removed from task", {
      taskAssignmentId: Number(taskAssignmentId),
      teamMemberId: team_member_id,
      userId: req.headers["x-user-id"],
    });
    res.status(200).json({
      success: true,
      message: "החופף הוסר בהצלחה",
    });
  } catch (error) {
    catchError(error, req, res, { function: "taskAssignmentHoef.removeHoefFromTask" });
  }
};
