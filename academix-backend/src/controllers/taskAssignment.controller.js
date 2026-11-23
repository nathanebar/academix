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

exports.getAllTaskAssignments = async (req, res) => {
  try {
    const assignments = await TaskAssignment.findAll();
    res.json(assignments);
  } catch (error) {
    catchError(error, req, res, { function: "taskAssignment.getAllTaskAssignments" });
  }
};

exports.getTaskAssignmentById = async (req, res) => {
  try {
    const assignment = await TaskAssignment.findByPk(req.params.id);
    if (!assignment)
      return res.status(404).json({ error: "TaskAssignment not found" });
    res.json(assignment);
  } catch (error) {
    catchError(error, req, res, { function: "taskAssignment.getTaskAssignmentById" });
  }
};

exports.createTaskAssignment = async (req, res) => {
  try {
    const assignment = await TaskAssignment.create(req.body);
    logger.info('TaskAssignment created', {
      taskAssignmentId: assignment.id,
      taskId: assignment.task_id,
      userId: assignment.user_id,
      teamId: assignment.team_id,
      userId: req.headers['x-user-id']
    });
    res.status(201).json(assignment);
  } catch (error) {
    catchError(error, req, res, { function: "taskAssignment.createTaskAssignment", status: 400 });
  }
};

exports.assignToTeam = async (req, res) => {
  const { taskId, teamId } = req.params;
  const { start, end, course_batch_id, realDate, isQueueTask } = req.body;
  const t = await sequelize.transaction();

  const assignedByUserId = req.headers['x-user-id']
    ? parseInt(req.headers['x-user-id'])
    : null;

  try {
    // סינון לפי מחזור
    const membersWhere = {
      team_id: teamId,
      member_role: "STUDENT",
      delete_reason: null,
    };

    if (course_batch_id) {
      membersWhere.course_batch_id = course_batch_id;
    }

    // ✅ שליפת החברים עם user_id
    const members = await TeamMember.findAll({
      where: membersWhere,
      attributes: ["id", "user_id"],
      raw: true,
      transaction: t,
    });

    if (!members.length) {
      await t.rollback();
      return res
        .status(404)
        .json({ message: "This team doesn't have any members in this batch" });
    }

    // ✅ שימוש ב-user_id (של ה-User), לא ב-id (של ה-TeamMember)
    const userIds = members.map((m) => m.id);

    const existingAssignments = await TaskAssignment.findAll({
      where: {
        task_id: taskId,
        user_id: userIds,
      },
      attributes: ["id", "user_id", "isQueueTask"],
      raw: true,
      transaction: t,
    });

    const alreadyAssignedMap = new Map();
    existingAssignments.forEach((a) =>
      alreadyAssignedMap.set(a.user_id, a)
    );

    const newAssignments = [];
    const occurrenceData = [];
    const assignmentsToUpdateFromQueue = [];

    members.forEach((member) => {
      const existing = alreadyAssignedMap.get(member.id);

      if (existing) {
        if (existing.isQueueTask) {
          // ✅ קיים כתור - עדכן: שים תאריכים + הוצא מהתור
          assignmentsToUpdateFromQueue.push({
            id: existing.id,
            start: start || null,
            end: end || null,
            isQueueTask: false,
            assigned_by_user_id: assignedByUserId,
          });
        } else {
          // ✅ קיים כמשימה רגילה - צור Occurrence
          occurrenceData.push({
            task_assignment_id: existing.id,
            start: start || null,
            end: end || null,
          });
        }
      } else {
        // ✅ לא קיים בכלל
        if (isQueueTask) {
          // ✅ isQueueTask=true - צור כתור (ללא תאריכים)
          newAssignments.push({
            task_id: taskId,
            user_id: member.id,
            team_id: teamId,
            course_batch_id: course_batch_id || null,
            start: null,
            end: null,
            isQueueTask: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            assigned_by_user_id: assignedByUserId,
          });
        } else {
          // ✅ isQueueTask=false - צור כמשימה רגילה עם תאריכים
          newAssignments.push({
            task_id: taskId,
            user_id: member.id,
            team_id: teamId,
            course_batch_id: course_batch_id || null,
            start: start || null,
            end: end || null,
            isQueueTask: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            assigned_by_user_id: assignedByUserId,
          });
        }
      }
    });

    // ✅ יצירת משימות חדשות
    const createdAssignments = newAssignments.length
      ? await TaskAssignment.bulkCreate(newAssignments, {
        transaction: t,
        ignoreDuplicates: true,
        returning: true,
      })
      : [];

    // ✅ עדכון משימות מתור (הוצאה מהתור + שים תאריכים)
    if (assignmentsToUpdateFromQueue.length) {
      for (const updateData of assignmentsToUpdateFromQueue) {
        await TaskAssignment.update(
          {
            start: updateData.start,
            end: updateData.end,
            isQueueTask: updateData.isQueueTask,
            assigned_by_user_id: updateData.assigned_by_user_id,
            updatedAt: new Date(),
          },
          {
            where: { id: updateData.id },
            transaction: t,
          }
        );
      }
    }

    // ✅ יצירת Occurrences למשימות רגילות קיימות
    const createdOccurrences = occurrenceData.length
      ? await TaskAssignmentOccurrence.bulkCreate(occurrenceData, {
        transaction: t,
        ignoreDuplicates: true,
        returning: true,
      })
      : [];

    await t.commit();

    const assignmentIds = createdAssignments.map((a) => a.id);
    const updatedFromQueueIds = assignmentsToUpdateFromQueue.map(
      (u) => u.id
    );
    const occurrenceIds = createdOccurrences.map((o) => o.id);

    if (
      !assignmentIds.length &&
      !updatedFromQueueIds.length &&
      !occurrenceIds.length
    ) {
      return res.json({ message: "All the members already have this task" });
    }

    return res.status(200).json({
      message: `Task ${taskId} assigned to ${members.length} members`,
      task_id: Number(taskId),
      course_batch_id: course_batch_id || null,
      new_assignment_ids: assignmentIds,
      updated_from_queue_ids: updatedFromQueueIds,
      new_occurrence_ids: occurrenceIds,
    });
  } catch (err) {
    await t.rollback();
    catchError(err, req, res);
  }
};

exports.assignToTeamNew = async (req, res) => {
  const { taskId, teamId } = req.params;
  const { start, end, course_batch_id, realDate, isQueueTask } = req.body;
  //                                   ↑ הוסף את זה
  const t = await sequelize.transaction();

  const assignedByUserId = req.headers['x-user-id']
    ? parseInt(req.headers['x-user-id'])
    : null;

  try {
    // סינון לפי מחזור
    const membersWhere = {
      team_id: teamId,
      member_role: "STUDENT",
      delete_reason: null,
    };

    if (course_batch_id) {
      membersWhere.course_batch_id = course_batch_id;
    }

    // שליפת החברים
    const members = await TeamMember.findAll({
      where: membersWhere,
      attributes: ["id"],
      raw: true,
      transaction: t,
    });

    if (!members.length) {
      await t.rollback();
      return res
        .status(404)
        .json({ message: "This team doesn't have any members in this batch" });
    }

    // תמיד צור משימות חדשות לכל החברים
    const newAssignments = members.map((member) => ({
      task_id: taskId,
      user_id: member.id,
      team_id: teamId,
      course_batch_id: course_batch_id || null,
      start: isQueueTask ? null : (start || null),      // ← עדכן
      end: isQueueTask ? null : (end || null),            // ← עדכן
      isQueueTask: isQueueTask ?? false,                  // ← הוסף
      createdAt: new Date(),
      updatedAt: new Date(),
      assigned_by_user_id: assignedByUserId,
    }));

    const createdAssignments = await TaskAssignment.bulkCreate(newAssignments, {
      transaction: t,
      returning: true,
    });

    await t.commit();

    const assignmentIds = createdAssignments.map((a) => a.id);

    return res.status(200).json({
      message: `Task ${taskId} assigned to ${members.length} members`,
      task_id: Number(taskId),
      course_batch_id: course_batch_id || null,
      new_assignment_ids: assignmentIds,
    });
  } catch (err) {
    await t.rollback();
    catchError(err, req, res);
  }
};

exports.assignToUserNew = async (req, res) => {
  const { taskId, userId } = req.params;
  const { start, end, team_id, course_batch_id, isQueueTask } = req.body;
  //                                                     ↑ הוסף
  const t = await sequelize.transaction();

  const assignedByUserId = req.headers['x-user-id']
    ? parseInt(req.headers['x-user-id'])
    : null;

  try {
    // בדיקה שהמשתמש קיים ושייך לצוות
    const member = await TeamMember.findOne({
      where: {
        id: userId,
        team_id: team_id,
      },
      transaction: t,
    });

    if (!member) {
      await t.rollback();
      return res.status(404).json({ message: "Member not found in this team" });
    }

    // תמיד צור משימה חדשה למשתמש הספציפי
    const newAssignment = await TaskAssignment.create(
      {
        task_id: taskId,
        user_id: userId,
        team_id: team_id,
        course_batch_id: course_batch_id || null,
        start: isQueueTask ? null : (start || null),  // ← עדכן
        end: isQueueTask ? null : (end || null),        // ← עדכן
        isQueueTask: isQueueTask ?? false,              // ← הוסף
        createdAt: new Date(),
        updatedAt: new Date(),
        assigned_by_user_id: assignedByUserId,
      },
      {
        transaction: t,
        returning: true,
      }
    );

    await t.commit();

    return res.status(200).json({
      message: `Task ${taskId} assigned to user ${userId}`,
      task_id: Number(taskId),
      course_batch_id: course_batch_id || null,
      data: {
        id: newAssignment.id,
        task_assignment_id: newAssignment.id,
      },
    });
  } catch (err) {
    await t.rollback();
    catchError(err, req, res);
  }
};


exports.assignToUser = async (req, res) => {
  const { taskId, userId } = req.params;
  const { teamId, start, end, course_batch_id, isQueueTask } = req.body;
  const t = await sequelize.transaction();

  const assignedByUserId = req.headers['x-user-id']
    ? parseInt(req.headers['x-user-id'])
    : null;

  try {
    const teamMember = await TeamMember.findOne({
      where: {
        id: userId,
        team_id: teamId,
      },
      transaction: t,
    });

    if (!teamMember) {
      await t.rollback();
      return res.status(404).json({
        message: "User is not a member of this team",
      });
    }

    // ✅ חיפוש משימה קיימת
    const existingAssignments = await TaskAssignment.findAll({
      where: {
        task_id: taskId,
        user_id: teamMember.id,
        team_id: teamId || null,
      },
      attributes: ["id", "user_id", "task_id", "isQueueTask"],
      raw: true,
      transaction: t,
    });

    const existing = existingAssignments[0];

    // ✅ אם קיימת
    if (existing) {
      if (existing.isQueueTask) {
        // ✅ קיים כתור - עדכן: שים תאריכים + הוצא מהתור
        await TaskAssignment.update(
          {
            start: start || null,
            end: end || null,
            isQueueTask: false,
            assigned_by_user_id: assignedByUserId,
            updatedAt: new Date(),
          },
          {
            where: { id: existing.id },
            transaction: t,
          }
        );

        await t.commit();
        return res.status(200).json({
          message: "Queue task updated - removed from queue",
          task_assignment_id: existing.id,
          task_id: taskId,
          start: start || null,
          end: end || null,
          isQueueTask: false,
        });

      } else {
        // ✅ קיים כמשימה רגילה - צור Occurrence
        const occurrence = await TaskAssignmentOccurrence.create(
          {
            task_assignment_id: existing.id,
            start: start || null,
            end: end || null,
          },
          { transaction: t }
        );

        await t.commit();
        return res.status(200).json({
          message: "Existing assignment – new occurrence created",
          task_assignment_id: existing.id,
          occurrence_id: occurrence.id,
          start: occurrence.start,
          end: occurrence.end,
        });
      }
    }

    // ✅ אין משימה – ניצור משימה חדשה
    if (isQueueTask) {
      // ✅ isQueueTask=true - צור כתור (ללא תאריכים)
      const newAssignment = await TaskAssignment.create(
        {
          task_id: taskId,
          user_id: teamMember.id,
          team_id: teamId || null,
          course_batch_id: course_batch_id || null,
          start: null,
          end: null,
          isQueueTask: true,
          assigned_by_user_id: assignedByUserId,
        },
        {
          transaction: t,
          ignoreDuplicates: true,
        }
      );

      await t.commit();


      return res.status(200).json({
        message: `Task ${taskId} assigned to user ${userId} as queue task`,
        task_assignment_id: newAssignment.id,
        task_id: newAssignment.task_id,
        course_batch_id: course_batch_id || null,
        isQueueTask: true,
      });

    } else {
      // ✅ isQueueTask=false - צור כמשימה רגילה עם תאריכים
      const newAssignment = await TaskAssignment.create(
        {
          task_id: taskId,
          user_id: teamMember.id,
          team_id: teamId || null,
          course_batch_id: course_batch_id || null,
          start: start || null,
          end: end || null,
          isQueueTask: false,
          assigned_by_user_id: assignedByUserId,
        },
        {
          transaction: t,
          ignoreDuplicates: true,
        }
      );

      await t.commit();
      return res.status(200).json({
        message: `Task ${taskId} assigned to user ${userId}`,
        task_assignment_id: newAssignment.id,
        task_id: newAssignment.task_id,
        course_batch_id: course_batch_id || null,
        isQueueTask: false,
      });
    }

  } catch (err) {
    await t.rollback();
    catchError(err, req, res);
  }
};

exports.updateTaskAssignmentTeam = async (req, res) => {
  try {
    const [updated] = await TaskAssignment.update(req.body, {
      where: { task_id: req.params.taskId, team_id: req.params.teamId },
    });
    if (!updated)
      return res.status(404).json({ error: "TaskAssignment not found" });

    logger.info('TaskAssignments updated by team', {
      taskId: req.params.taskId,
      teamId: req.params.teamId,
      updatedFields: Object.keys(req.body),
      userId: req.headers['x-user-id']
    });
    const updatedAssignment = await TaskAssignment.findByPk(req.params.id);
    res.json(updatedAssignment);
  } catch (error) {
    catchError(error, req, res, { function: "taskAssignment.updateTaskAssignmentTeam", status: 400 });
  }
};

exports.updateTaskAssignmentUser = async (req, res) => {
  try {
    const [updated] = await TaskAssignment.update(req.body, {
      where: { id: req.params.id },
    });
    if (!updated)
      return res.status(404).json({ error: "TaskAssignment not found" });
    logger.info('TaskAssignment updated', {
      taskAssignmentId: req.params.id,
      updatedFields: Object.keys(req.body),
      userId: req.headers['x-user-id']
    });
    const updatedAssignment = await TaskAssignment.findByPk(req.params.id);
    res.json(updatedAssignment);
  } catch (error) {
    catchError(error, req, res, { function: "taskAssignment.updateTaskAssignmentUser", status: 400 });
  }
};

exports.updateTaskAssignmentOccurrence = async (req, res) => {
  try {
    const occurrenceId = Number(req.params.id);
    const [rowsUpdated] = await TaskAssignmentOccurrence.update(req.body, {
      where: { id: occurrenceId },
    });
    if (rowsUpdated === 0) {
      return res
        .status(404)
        .json({ error: "TaskAssignmentOccurrence not found" });
    }

    logger.info('TaskAssignmentOccurrence updated', {
      occurrenceId: occurrenceId,
      updatedFields: Object.keys(req.body),
      userId: req.headers['x-user-id']
    });
    const updatedOccurrence = await TaskAssignmentOccurrence.findByPk(
      occurrenceId
    );
    return res.json(updatedOccurrence);
  } catch (err) {
    catchError(err, req, res);
  }
};

exports.assignedTeamDay = async (req, res) => {
  try {
    const { date, teamId, course_batch_id } = req.params; // date = "YYYY‑MM‑DD"

    const sql = `
      WITH team_members AS (
        SELECT tm.id AS member_id
        FROM "TeamMembers" tm
        WHERE tm."team_id" = :teamId
          AND tm."member_role" = 'STUDENT' AND tm."course_batch_id" = :course_batch_id 
      ),
      all_rows AS (
        SELECT
          ta.id                     AS id,
          ta.id                     AS taskAssignmentId,
          NULL::bigint              AS occurrence_id,
          t.id                      AS task_id,
          t.name                    AS name,
          tg.name                   AS gn,
          t.color                   AS color,
          ta."start"                AS start,
          ta."end"                  AS "end",
          ta."assigned_by_user_id"  AS assigned_by_user_id,
          'assignment'              AS source
        FROM "TaskAssignments" ta
        JOIN "Tasks" t            ON t.id = ta."task_id"
        LEFT JOIN "TaskGroups" tg ON tg.id = t."taskGroupId"
        LEFT JOIN "Axes" a        ON a.id = tg."axisId"
        WHERE ta."team_id" = :teamId
          AND (ta."start" AT TIME ZONE 'Asia/Jerusalem')::date = :assigned_date
          AND ta."user_id" IN (SELECT member_id FROM team_members)
        UNION ALL
        SELECT
          occ.id                    AS id,
          ta.id                     AS taskAssignmentId,
          occ.id                    AS occurrence_id,
          t.id                      AS task_id,
          t.name                    AS name,
          tg.name                   AS gn,
          t.color                   AS color,
          occ."start"               AS start,
          occ."end"                 AS "end",
          ta."assigned_by_user_id"  AS assigned_by_user_id,
          'occurrence'              AS source
        FROM "TaskAssignmentOccurrences" occ
        JOIN "TaskAssignments" ta   ON ta.id = occ.task_assignment_id
        JOIN "Tasks" t              ON t.id = ta."task_id"
        LEFT JOIN "TaskGroups" tg   ON tg.id = t."taskGroupId"
        LEFT JOIN "Axes" a          ON a.id = tg."axisId"
        WHERE ta."team_id" = :teamId
          AND DATE(occ."start") = :assigned_date
          AND ta."user_id" IN (SELECT member_id FROM team_members)
      )
      SELECT
        CONCAT(
          task_id, '_',
          TO_CHAR(start, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), '_',
          TO_CHAR("end", 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
        )                                          AS id,
        task_id,
        name,
        gn,
        color,
        start,
        "end",
        assigned_by_user_id                        AS "assignedById",
        json_agg(
          json_build_object(
            'id',               id,
            'taskAssignmentId', taskAssignmentId,
            'occurrence_id',    occurrence_id,
            'source',           source
          )
          ORDER BY
            CASE WHEN source = 'assignment' THEN 0 ELSE 1 END,
            id
        )                                           AS items
      FROM all_rows
      GROUP BY
        task_id, name, gn, color, start, "end", assigned_by_user_id
      ORDER BY start ASC, task_id ASC;
    `;
    const results = await sequelize.query(sql, {
      replacements: {
        teamId: Number(teamId),
        assigned_date: date,
        course_batch_id: course_batch_id,
      },
      type: sequelize.QueryTypes.SELECT,
      raw: true,
    });

    const assignedByUserIds = results
      .map((t) => t.assigned_by_user_id)
      .filter((id) => id);

    let assignerNamesMap = new Map();
    if (assignedByUserIds.length > 0) {
      const uniqueIds = [...new Set(assignedByUserIds)];
      const assignersQuery = `
        SELECT id, name
        FROM "Users"
        WHERE id = ANY(:userIds)
      `;
      const assigners = await sequelize.query(assignersQuery, {
        replacements: { userIds: uniqueIds },
        type: sequelize.QueryTypes.SELECT,
        raw: true,
      });
      assigners.forEach((user) => {
        assignerNamesMap.set(user.id, user.name);
      });
    }

    results.forEach((task) => {
      task.assignedByName = task.assigned_by_user_id
        ? assignerNamesMap.get(task.assigned_by_user_id) || null
        : null;
    });

    res.status(200).json({ success: true, data: results });
  } catch (err) {
    catchError(err, req, res);
  }
};

exports.assignedTeamDayRange = async (req, res) => {
  try {
    const { startDate, endDate, teamId, course_batch_id } = req.params;

    if (!course_batch_id || course_batch_id === "undefined") {
      return res.status(400).json({
        error: "חסר פרמטר: course_batch_id",
      });
    }

    const skipVisibility = req.query.skipVisibility === "true";
    const sql = `
  WITH team_members AS (
    SELECT tm.id AS member_id
    FROM "TeamMembers" tm
    WHERE tm."team_id" = :teamId
      AND tm."member_role" = 'STUDENT' AND tm."course_batch_id" = :course_batch_id 
  ),
  visibility_settings AS (
    SELECT 
      task_id,
      start_minutes_before,
      end_minutes_after
    FROM "TaskVisibilityOverrides"
    WHERE team_id = :teamId
  ),
  all_rows AS (
    -- ═══════════════════════════════════════════════════
    -- חלק ראשון: TaskAssignments
    -- ═══════════════════════════════════════════════════
    SELECT
      ta.id                     AS id,
      ta.id                     AS taskAssignmentId,
      NULL::bigint              AS occurrence_id,
      t.id                      AS task_id,
      t.name                    AS name,
      t.status                  AS status, 
      t."exposure"              AS exposure, 
      t."feedbackId"            AS "feedbackId",  
      COALESCE(v.start_minutes_before, 0)  AS start_minutes_before,
      COALESCE(v.end_minutes_after, 0)      AS end_minutes_after,
      u.username                AS "creatorUsername", 
      u.name                    AS "creatorName", 
      tg.name                   AS gn,
      a.color                   AS color,
      t.color                   AS Tcolor,
      t."notRequiredToSubmit"   AS "notRequiredToSubmit",
      ta."start"                AS start,
      ta."end"                  AS "end",
      ta."user_id"              AS user_id,
      ta."assigned_by_user_id"  AS assigned_by_user_id,
       COALESCE(tah."team_member_id", tm.id)                    AS team_member_id,
   hoef.name AS hoef_name,
hoef.username AS hoef_username,
     student.name              AS student_name,
      'assignment'              AS source
    FROM "TaskAssignments" ta
      LEFT JOIN "TeamMembers" tm 
    ON tm.user_id = ta.user_id 
    AND tm.team_id = :teamId
  LEFT JOIN "TaskAssignmentHofefs" tah 
    ON tah.task_assignment_id = ta.id
  LEFT JOIN "TeamMembers" tm_hoef 
    ON tm_hoef.id = tah.team_member_id
  LEFT JOIN "Users" hoef 
    ON hoef.id = tm_hoef.user_id
LEFT JOIN "TeamMembers" tm_student ON tm_student.id = ta.user_id
LEFT JOIN "Users" student ON student.id = tm_student.user_id
    JOIN "Tasks" t            ON t.id = ta."task_id"
    LEFT JOIN "TaskGroups" tg ON tg.id = t."taskGroupId"
    LEFT JOIN "Users" u      ON u.id = t."creatorId"
    LEFT JOIN "Axes" a       ON a.id = tg."axisId"
    LEFT JOIN visibility_settings v ON v.task_id = t.id
    WHERE ta."team_id" = :teamId
       AND (ta."start" AT TIME ZONE 'Asia/Jerusalem')::date BETWEEN :startDate AND :endDate
      AND ta."user_id" IN (SELECT member_id FROM team_members)
 AND ta."deletedAt" IS NULL         
  AND t."deletedAt" IS NULL
    UNION ALL

    -- ═══════════════════════════════════════════════════
    -- חלק שני: TaskAssignmentOccurrences (באותו סדר עמודות!)
    -- ═══════════════════════════════════════════════════
    SELECT
      occ.id                    AS id,                     
      ta.id                     AS taskAssignmentId,
      occ.id                    AS occurrence_id,
      t.id                      AS task_id,
      t.name                    AS name,
      t.status                  AS status, 
      t."exposure"              AS exposure,
      t."feedbackId"            AS "feedbackId",  
      COALESCE(v.start_minutes_before, 0)  AS start_minutes_before,
      COALESCE(v.end_minutes_after, 0)      AS end_minutes_after,
      u.username                AS "creatorUsername", 
      u.name                    AS "creatorName", 
      tg.name                   AS gn,
      a.color                   AS color,
      t.color                   AS Tcolor,
      t."notRequiredToSubmit"   AS "notRequiredToSubmit",
      occ."start"               AS start,
      occ."end"                 AS "end",
      ta."user_id"              AS user_id,
      ta."assigned_by_user_id"  AS assigned_by_user_id,
        COALESCE(tah."team_member_id", tm.id)                    AS team_member_id,
   hoef.name AS hoef_name,
hoef.username AS hoef_username,
    
     student.name              AS student_name,
      'occurrence'              AS source
    FROM "TaskAssignmentOccurrences" occ
    JOIN "TaskAssignments" ta   ON ta.id = occ.task_assignment_id
    LEFT JOIN "TeamMembers" tm 
    ON tm.user_id = ta.user_id 
    AND tm.team_id = :teamId
  LEFT JOIN "TaskAssignmentHofefs" tah 
    ON tah.task_assignment_id = ta.id
  LEFT JOIN "TeamMembers" tm_hoef 
    ON tm_hoef.id = tah.team_member_id
  LEFT JOIN "Users" hoef 
    ON hoef.id = tm_hoef.user_id
LEFT JOIN "TeamMembers" tm_student ON tm_student.id = ta.user_id
LEFT JOIN "Users" student ON student.id = tm_student.user_id
    JOIN "Tasks" t             ON t.id = ta."task_id"
    LEFT JOIN "Users" u       ON u.id = t."creatorId"
    LEFT JOIN "TaskGroups" tg ON tg.id = t."taskGroupId"
    LEFT JOIN "Axes" a        ON a.id = tg."axisId"
    LEFT JOIN visibility_settings v ON v.task_id = t.id
    WHERE ta."team_id" = :teamId
      AND DATE(occ."start") BETWEEN :startDate AND :endDate
      AND ta."user_id" IN (SELECT member_id FROM team_members)
        AND ta."deletedAt" IS NULL         
  AND t."deletedAt" IS NULL           
  ),
  with_visibility AS (
    SELECT
      *,
      CASE 
        WHEN :skipVisibility THEN true
        WHEN start_minutes_before = 0 AND end_minutes_after = 0 THEN true
        WHEN start_minutes_before > 0 OR end_minutes_after > 0 THEN
          NOW() BETWEEN 
            (start - (start_minutes_before || ' minutes')::interval) 
            AND 
            ("end" + (end_minutes_after || ' minutes')::interval)
        ELSE true
      END AS is_visible
    FROM all_rows
  )
  SELECT
    CONCAT(
      task_id, '_',
      TO_CHAR(start, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), '_',
      TO_CHAR("end", 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
    )                      AS id,          
    task_id,
    name,
    gn,
    color,
    Tcolor,
    "notRequiredToSubmit",
    "feedbackId",
    start,
    "end",
    "creatorUsername",
    "creatorName",
    "status",
    exposure,   
    start_minutes_before,
    end_minutes_after,
    (start_minutes_before > 0 OR end_minutes_after > 0) AS is_scheduled,
    COUNT(DISTINCT user_id)  AS "assignedCount",
    (SELECT COUNT(*) FROM team_members) AS "totalMembers",
    ROUND(
      (COUNT(DISTINCT user_id)::decimal /
       NULLIF((SELECT COUNT(*) FROM team_members),0)) * 100,
      2)                     AS "completionRate",
    assigned_by_user_id      AS "assignedById",
    json_agg(
      json_build_object(
        'id',               id,
        'taskAssignmentId', taskAssignmentId,
        'occurrence_id',    occurrence_id,
        'source',           source,
        'team_member_id',   team_member_id,
      'hoef_name',        hoef_name,
      'hoef_username',    hoef_username,
      'student_name',     student_name
      )
      ORDER BY
        CASE WHEN source = 'assignment' THEN 0 ELSE 1 END,
        id
    )                     AS items
  FROM with_visibility
  WHERE is_visible = true
  GROUP BY
    task_id, name, gn, color, Tcolor, "notRequiredToSubmit", start, "end", "feedbackId",
    "creatorUsername", "creatorName", "status", exposure, 
    start_minutes_before, end_minutes_after, assigned_by_user_id
  ORDER BY start ASC, task_id ASC;
`;
    const results = await sequelize.query(sql, {
      replacements: {
        teamId: Number(teamId),
        startDate,
        endDate,
        skipVisibility,
        course_batch_id,
      },
      type: sequelize.QueryTypes.SELECT,
      raw: true,
    });

   
    
     const assignedByUserIds = results
      .map((t) => t.assignedById)
      .filter((id) => id);

    let assignerNamesMap = new Map();
    if (assignedByUserIds.length > 0) {
      const uniqueIds = [...new Set(assignedByUserIds)];
      
      const assignersQuery = `SELECT id, name FROM "Users" WHERE id IN (:uniqueIds)`;

      const assigners = await sequelize.query(assignersQuery, {
        replacements: { uniqueIds },
        type: sequelize.QueryTypes.SELECT,
        raw: true,
      });
      assigners.forEach((user) => {
        assignerNamesMap.set(user.id, user.name);
      });
    }

    results.forEach((task) => {
      task.hasExposure = task.exposure === true;

      task.assignedByName = task.assignedById
        ? assignerNamesMap.get(task.assignedById) || null
        : null;
    });

  
    
    res.status(200).json({ success: true, data: results });
  } catch (err) {
    catchError(err, req, res);
  }
};

exports.assignedUserDay = async (req, res) => {
  try {
    const { date, userId, teamId } = req.params;
    const skipVisibility = req.query.skipVisibility === "true";
    const teamMember = await TeamMember.findOne({
      where: {
        user_id: userId,
        team_id: teamId,
      },
      raw: true,
    });

    if (!teamMember) {
      return res.status(200).json({ success: true, data: [] });
    }

    const teamMemberId = teamMember.id;

    const query = `
      WITH visibility_settings AS (
        SELECT 
          task_id,
          start_minutes_before,
          end_minutes_after
        FROM "TaskVisibilityOverrides"
        WHERE team_id = :teamId
      )
      SELECT
        ta.id                          AS id,
        ta.id                          AS taskAssignmentId,
        NULL::bigint                   AS occurrence_id,
        t.id                           AS task_id,
        t."recommendedTime",
        t.name                         AS name,
        tg.name                        AS gn,
        a.color                        AS color,
        ta."start"                     AS most_frequent_assigned_at_start,
        ta."end"                       AS most_frequent_assigned_at_end,
        ta.completed                   AS completed,
        ta."completed_at"              AS completed_at,
        'assignment'                   AS source,
        COALESCE(v.start_minutes_before, 0)  AS start_minutes_before,
        COALESCE(v.end_minutes_after, 0)      AS end_minutes_after,
        (COALESCE(v.start_minutes_before, 0) > 0 OR COALESCE(v.end_minutes_after, 0) > 0) AS is_scheduled,
        ta."assigned_by_user_id"       AS assigned_by_user_id
      FROM "TaskAssignments" ta
      LEFT JOIN "Tasks"       t  ON t.id  = ta."task_id"
      LEFT JOIN "TaskGroups" tg ON tg.id = t."taskGroupId"
      LEFT JOIN "Axes"       a  ON a.id  = tg."axisId"
      LEFT JOIN visibility_settings v ON v.task_id = t.id
      WHERE ta."user_id" = :teamMemberId
        AND ta."team_id" = :teamId 
        AND DATE(ta."start") = :assigned_date
      UNION ALL
      SELECT
        occ.id                         AS id,
        ta.id                          AS taskAssignmentId,
        occ.id                         AS occurrence_id,
        t.id                           AS task_id,
        t.name                         AS name,
        t."recommendedTime",
        tg.name                        AS gn,
        a.color                        AS color,
        occ."start"                    AS most_frequent_assigned_at_start,
        occ."end"                      AS most_frequent_assigned_at_end,
        ta.completed                   AS completed,
        ta."completed_at"              AS completed_at,
        'occurrence'                   AS source,
        COALESCE(v.start_minutes_before, 0)  AS start_minutes_before,
        COALESCE(v.end_minutes_after, 0)      AS end_minutes_after,
        (COALESCE(v.start_minutes_before, 0) > 0 OR COALESCE(v.end_minutes_after, 0) > 0) AS is_scheduled,
        ta."assigned_by_user_id"       AS assigned_by_user_id
      FROM "TaskAssignments" ta
      JOIN  "TaskAssignmentOccurrences" occ ON occ.task_assignment_id = ta.id
      LEFT JOIN "Tasks"       t  ON t.id  = ta."task_id"
      LEFT JOIN "TaskGroups" tg ON tg.id = t."taskGroupId"
      LEFT JOIN "Axes"       a  ON a.id  = tg."axisId"
      LEFT JOIN visibility_settings v ON v.task_id = t.id
      WHERE ta."user_id" = :teamMemberId
        AND ta."team_id" = :teamId 
        AND DATE(occ."start") = :assigned_date
      ORDER BY most_frequent_assigned_at_start ASC, source ASC;
    `;

    const allResults = await sequelize.query(query, {
      replacements: {
        teamMemberId,
        teamId,
        assigned_date: date,
      },
      type: sequelize.QueryTypes.SELECT,
      raw: true,
    });

    const now = new Date();

    const assignedByUserIds = allResults
      .map((t) => t.assigned_by_user_id)
      .filter((id) => id);

    let assignerNamesMap = new Map();
    if (assignedByUserIds.length > 0) {
      const uniqueIds = [...new Set(assignedByUserIds)];
      const assignersQuery = `
        SELECT id, name
        FROM "Users"
        WHERE id = ANY(:userIds)
      `;
      const assigners = await sequelize.query(assignersQuery, {
        replacements: { userIds: uniqueIds },
        type: sequelize.QueryTypes.SELECT,
        raw: true,
      });
      assigners.forEach((user) => {
        assignerNamesMap.set(user.id, user.name);
      });
    }

    allResults.forEach((task) => {
      task.assignedByName = task.assigned_by_user_id
        ? assignerNamesMap.get(task.assigned_by_user_id) || null
        : null;
    });

    const filteredResults = allResults.filter((row) => {
      const start = new Date(row.most_frequent_assigned_at_start);
      const end = new Date(row.most_frequent_assigned_at_end);
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
    });

    res.status(200).json({
      success: true,
      data: filteredResults,
    });
  } catch (error) {
    catchError(error, req, res);
  }
};

exports.assignedUserDayRange = async (req, res) => {
  try {
    const { startDate, endDate, userId, teamId, course_batch_id } = req.params;



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
      permission &&
      typeof permission === "string" &&
      ROLES.includes(permission);

    const teamCourseBatchQuery = `
      SELECT is_block_color_enabled
      FROM "TeamCourseBatches"
      WHERE team_id = :teamId
        AND course_batch_id = :course_batch_id
    `;
    const teamCourseBatchResult = await sequelize.query(teamCourseBatchQuery, {
      replacements: { teamId, course_batch_id },
      type: sequelize.QueryTypes.SELECT,
      raw: true,
    });
    const isBlockColorEnabled =
      teamCourseBatchResult[0]?.is_block_color_enabled ?? false;

    // ❌ לפני - מסתיים בפסיק
    // const colorSelect = `
    //   a.color AS color,
    //   CASE ...
    //   END AS Tcolor,     ← פסיק כאן!
    // `;

    // ✅ אחרי - ללא פסיק בסוף
    const colorSelect = `
      a.color AS color,
      CASE
        WHEN :hasSpecialPermission THEN t.color
        WHEN t.status = 'assignment_bank' THEN t.color
        WHEN :isBlockColorEnabled = false THEN t.color
        ELSE NULL
      END AS Tcolor
    `;

    const sql = `
   WITH team_members AS (
  SELECT tm.id AS member_id
  FROM "TeamMembers" tm
  WHERE tm."team_id" = :teamId
    AND tm."member_role" = 'STUDENT' 
    AND tm."course_batch_id" = :course_batch_id 
),
visibility_settings AS (
  SELECT 
    task_id,
    start_minutes_before,
    end_minutes_after
  FROM "TaskVisibilityOverrides"
  WHERE team_id = :teamId
),
all_rows AS (
  -- ═══════════════════════════════════════════════════
  -- חלק ראשון: TaskAssignments
  -- ═══════════════════════════════════════════════════
  SELECT
    ta.id                     AS id,
    ta.id                     AS taskAssignmentId,
    NULL::bigint              AS occurrence_id,
    t.id                      AS task_id,
    t.name                    AS name,
    t."recommendedTime",
    t."notRequiredToSubmit",
    t.status                  AS task_status,
    t."formId"                AS "formId",    
    t."exposure"              AS exposure, 
    t."feedbackId"            AS "feedbackId",
    COALESCE(v.start_minutes_before, 0)  AS start_minutes_before,
    COALESCE(v.end_minutes_after, 0)      AS end_minutes_after,
    u.username                AS "creatorUsername",
    u.name                    AS "creatorName",
    tg.name                   AS gn,
    ${colorSelect},
    ta."start"                AS start,
    ta."end"                  AS "end",
    ta."completed_at"         AS "completed_at",           
    ta.completed              AS completed, 
    ta.id                     AS task_assignment_id,
    ta."assigned_by_user_id"  AS assigned_by_user_id,
    -- 👇 הוספת שדות Hoef
    tah.id                    AS hoef_assignment_id,
    tah.team_member_id        AS hoef_team_member_id,
    hoef.name                 AS hoef_name,
    hoef.username             AS hoef_username,
    -- 👇 שם התלמיד (המקורי)
    student.name              AS student_name,
    student.username          AS student_username,
    CASE WHEN tah.id IS NOT NULL THEN true ELSE false END AS has_hoef,
    'assignment'              AS source
  FROM "TaskAssignments" ta
  JOIN "Tasks" t             ON t.id = ta."task_id"
  LEFT JOIN "Users" u        ON u.id = t."creatorId"
  LEFT JOIN "TaskGroups" tg  ON tg.id = t."taskGroupId"
  LEFT JOIN "Axes" a         ON a.id = tg."axisId"
  LEFT JOIN visibility_settings v ON v.task_id = t.id
  -- 👇 הוספת JOINs ל-Hoef
  LEFT JOIN "TaskAssignmentHofefs" tah 
    ON tah.task_assignment_id = ta.id
  LEFT JOIN "TeamMembers" tm_hoef 
    ON tm_hoef.id = tah.team_member_id
  LEFT JOIN "Users" hoef 
    ON hoef.id = tm_hoef.user_id
  -- 👇 תיקון JOIN לתלמיד
  LEFT JOIN "TeamMembers" tm_student 
    ON tm_student.user_id = ta.user_id
  LEFT JOIN "Users" student 
    ON student.id = tm_student.user_id
  WHERE ta."user_id" = :teamMemberId
    AND ta."team_id" = :teamId
    AND (ta."start" AT TIME ZONE 'Asia/Jerusalem')::date BETWEEN :startDate AND :endDate
    AND ta."user_id" IN (SELECT member_id FROM team_members)
     AND ta."deletedAt" IS NULL  
  AND t."deletedAt" IS NULL 

  UNION ALL

  -- ═══════════════════════════════════════════════════
  -- חלק שני: TaskAssignmentOccurrences
  -- ═══════════════════════════════════════════════════
  SELECT
    occ.id                    AS id,
    ta.id                     AS taskAssignmentId,
    occ.id                    AS occurrence_id,
    t.id                      AS task_id,
    t.name                    AS name,    
    t."recommendedTime",  
    t."notRequiredToSubmit",
    t.status                  AS task_status, 
    t."formId"                AS "formId",
    t."exposure"              AS exposure,
    t."feedbackId"            AS "feedbackId", 
    COALESCE(v.start_minutes_before, 0)  AS start_minutes_before,
    COALESCE(v.end_minutes_after, 0)      AS end_minutes_after,
    u.username                AS "creatorUsername", 
    u.name                    AS "creatorName",   
    tg.name                   AS gn,
    ${colorSelect},
    occ."start"               AS start,
    occ."end"                 AS "end",
    ta."completed_at"         AS "completed_at",           
    ta.completed              AS completed,           
    ta.id                     AS task_assignment_id,
    ta."assigned_by_user_id"  AS assigned_by_user_id,
    -- 👇 הוספת שדות Hoef
    tah.id                    AS hoef_assignment_id,
    tah.team_member_id        AS hoef_team_member_id,
    hoef.name                 AS hoef_name,
    hoef.username             AS hoef_username,
    -- 👇 שם התלמיד (המקורי)
    student.name              AS student_name,
    student.username          AS student_username,
    CASE WHEN tah.id IS NOT NULL THEN true ELSE false END AS has_hoef,
    'occurrence'              AS source
  FROM "TaskAssignmentOccurrences" occ
  JOIN "TaskAssignments" ta   ON ta.id = occ.task_assignment_id
  JOIN "Tasks" t             ON t.id = ta."task_id"
  LEFT JOIN "Users" u        ON u.id = t."creatorId"
  LEFT JOIN "TaskGroups" tg  ON tg.id = t."taskGroupId"
  LEFT JOIN "Axes" a         ON a.id = tg."axisId"
  LEFT JOIN visibility_settings v ON v.task_id = t.id
  -- 👇 הוספת JOINs ל-Hoef
  LEFT JOIN "TaskAssignmentHofefs" tah 
    ON tah.task_assignment_id = ta.id
  LEFT JOIN "TeamMembers" tm_hoef 
    ON tm_hoef.id = tah.team_member_id
  LEFT JOIN "Users" hoef 
    ON hoef.id = tm_hoef.user_id
  -- 👇 תיקון JOIN לתלמיד
  LEFT JOIN "TeamMembers" tm_student 
    ON tm_student.user_id = ta.user_id
  LEFT JOIN "Users" student 
    ON student.id = tm_student.user_id
  WHERE ta."user_id" = :teamMemberId
    AND ta."team_id" = :teamId
    AND DATE(occ."start") BETWEEN :startDate AND :endDate
    AND ta."user_id" IN (SELECT member_id FROM team_members)
      AND ta."deletedAt" IS NULL     
  AND t."deletedAt" IS NULL  
),
with_visibility AS (
  SELECT
    *,
    CASE 
      WHEN :skipVisibility THEN true
      WHEN start_minutes_before = 0 AND end_minutes_after = 0 THEN true
      WHEN start_minutes_before > 0 OR end_minutes_after > 0 THEN
        NOW() BETWEEN 
          (start - (start_minutes_before || ' minutes')::interval) 
          AND 
          ("end" + (end_minutes_after || ' minutes')::interval)
      ELSE true
    END AS is_visible
  FROM all_rows
)
SELECT
DISTINCT ON ( task_id, start, "end")
  CONCAT(
    task_id, '_',
    TO_CHAR(start, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), '_',
    TO_CHAR("end", 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
  )                      AS id, 
  task_id                AS "task_id",
  name,
  gn,
  color,
  Tcolor,
  "recommendedTime",
  "notRequiredToSubmit",
  task_status,
  "formId",
  "feedbackId",  
  exposure, 
  start                  AS most_frequent_assigned_at_start,
  "end"                  AS most_frequent_assigned_at_end,
  "completed_at",
  completed,
  task_assignment_id,
  taskAssignmentId,
  occurrence_id,
  source,
  "creatorUsername",
  "creatorName",
  start_minutes_before,
  end_minutes_after,
  (start_minutes_before > 0 OR end_minutes_after > 0) AS is_scheduled,
  assigned_by_user_id    AS "assignedById",
  -- 👇 שדות Hoef בתשובה
  has_hoef,
  hoef_name,
  hoef_username,
  student_name,
  student_username,
  hoef_team_member_id
FROM with_visibility
WHERE is_visible = true
ORDER BY start ASC, task_id ASC;
    `;

   
    
    const results = await sequelize.query(sql, {
      replacements: {
        teamMemberId: userId,
        teamId: Number(teamId),
        startDate,
        endDate,
        skipVisibility,
        course_batch_id,
        // Booleans for colorSelect (hasSpecialPermission is undefined without the
        // selectedpermission header, which produced the SQL "WHEN undefined THEN").
        hasSpecialPermission: Boolean(hasSpecialPermission),
        isBlockColorEnabled: Boolean(isBlockColorEnabled),
      },
      type: sequelize.QueryTypes.SELECT,
      raw: true,
    });


    const now = new Date();

     const assignedByUserIds = results
      .map((t) => t.assignedById)
      .filter((id) => id);

    let assignerNamesMap = new Map();
    if (assignedByUserIds.length > 0) {
      const uniqueIds = [...new Set(assignedByUserIds)];
      
      const assignersQuery = `SELECT id, name FROM "Users" WHERE id IN (:uniqueIds)`;

      const assigners = await sequelize.query(assignersQuery, {
        replacements: { uniqueIds },
        type: sequelize.QueryTypes.SELECT,
        raw: true,
      });
      assigners.forEach((user) => {
        assignerNamesMap.set(user.id, user.name);
      });
    }

    results.forEach((task) => {
      const isExposure = task.exposure === true;
      const startDate = new Date(task.start);
      task.isLocked = isExposure && now < startDate;
      task.hasExposure = isExposure;

      task.assignedByName = task.assignedById
        ? assignerNamesMap.get(task.assignedById) || null
        : null;
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
          const taskStart = task.most_frequent_assigned_at_start;
          const taskStatus = task.task_status;
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
    // 2️⃣ Add Form data to filtered results
    // ==========================================
    const taskAssignmentIds = filteredResults
      .map((t) => t?.task_assignment_id)
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



    res.status(200).json({ success: true, data: filteredResults });
  } catch (err) {
    catchError(err, req, res);
  }
};
exports.deleteTaskAssignmentTeam = async (req, res) => {
  try {
    const { taskId, teamId } = req.params;
    const { assignment_ids } = req.body; // מערך של IDs למחיקה (אופציונלי)

    let deleted;

    if (assignment_ids && Array.isArray(assignment_ids) && assignment_ids.length > 0) {

      deleted = await TaskAssignment.destroy({
        where: {
          id: assignment_ids,
          task_id: taskId,
          team_id: teamId,
        },
      });

      logger.info('TaskAssignments deleted by team (specific)', {
        taskId,
        teamId,
        assignmentIds: assignment_ids,
        deletedCount: deleted,
        userId: req.headers['x-user-id']
      });

    } else {
      // ✅ מחיקה של כל השיבוצים למשימה/קבוצה (הלוגיקה המקורית)
      deleted = await TaskAssignment.destroy({
        where: {
          task_id: taskId,
          team_id: teamId,
        },
      });

      logger.info('TaskAssignments deleted by team', {
        taskId,
        teamId,
        deletedCount: deleted,
        userId: req.headers['x-user-id']
      });
    }

    if (!deleted) {
      return res.status(404).json({ error: "TaskAssignment not found" });
    }

    res.json({
      message: "TaskAssignment deleted",
      deleted_count: deleted
    });

  } catch (error) {
    catchError(error, req, res, { function: "taskAssignment.deleteTaskAssignmentTeam" });
  }
};
exports.deleteTaskAssignmentOccurrenceTeam = async (req, res) => {
  try {
    const { occurrenceId, teamId } = req.params;
    const occurrence = await TaskAssignmentOccurrence.findOne({
      where: { id: occurrenceId },
      include: [
        {
          model: TaskAssignment,
          as: "parentAssignment",
          attributes: ["team_id", "id"],
        },
      ],
    });
    if (!occurrence) {
      return res
        .status(404)
        .json({ error: "TaskAssignmentOccurrence not found" });
    }
    if (occurrence.parentAssignment.team_id !== Number(teamId)) {
      return res.status(403).json({
        error: "Occurrence does not belong to the specified team",
      });
    }
    await TaskAssignmentOccurrence.destroy({ where: { id: occurrenceId } });

    logger.info('TaskAssignmentOccurrence deleted', {
      occurrenceId: occurrenceId,
      teamId: teamId,
      taskAssignmentId: occurrence.task_assignment_id,
      userId: req.headers['x-user-id']
    });
    return res.json({
      message: "TaskAssignmentOccurrence deleted successfully",
      deletedId: occurrenceId,
    });
  } catch (err) {
    catchError(err, req, res);
  }
};

exports.deleteTaskAssignmentByUserId = async (req, res) => {
  try {
    const teamMemberExists = await TeamMember.findOne({
      where: {
        user_id: req.params.userId,
        team_id: req.params.teamId,
      },
    });
    const deleted = await TaskAssignment.destroy({
      where: {
        task_id: req.params.taskId,
        team_id: req.params.teamId,
        user_id: teamMemberExists.id,
      },
    });
    if (!deleted)
      return res
        .status(404)
        .json({ deleted: deleted, error: "TaskAssignment not found" });

    logger.info('TaskAssignment deleted by userId', {
      taskId: req.params.taskId,
      teamId: req.params.teamId,
      userId: req.params.userId,
      userId: req.headers['x-user-id']
    });
    res.json({ message: "TaskAssignment deleted" });
  } catch (error) {
    console.log(error.message);
    catchError(error, req, res, { function: "taskAssignment.deleteTaskAssignmentByUserId" });
  }
};

exports.deleteTaskAssignment = async (req, res) => {
  try {
    const deleted = await TaskAssignment.destroy({
      where: { id: req.params.id },
    });
    if (!deleted)
      return res.status(404).json({ error: "TaskAssignment not found" });

    logger.info('TaskAssignment deleted', {
      taskAssignmentId: req.params.id,
      userId: req.headers['x-user-id']
    });
    res.json({ message: "TaskAssignment deleted" });
  } catch (error) {
    catchError(error, req, res, { function: "taskAssignment.deleteTaskAssignment" });
  }
};

exports.deleteTaskAssignmentOccurrence = async (req, res) => {
  try {
    const occurrenceId = Number(req.params.id);
    const deletedRows = await TaskAssignmentOccurrence.destroy({
      where: { id: occurrenceId },
    });
    if (deletedRows === 0) {
      return res
        .status(404)
        .json({ error: "TaskAssignmentOccurrence not found" });
    }

    logger.info('TaskAssignmentOccurrence deleted', {
      occurrenceId: occurrenceId,
      userId: req.headers['x-user-id']
    });

    return res.json({
      message: "TaskAssignmentOccurrence deleted successfully",
    });
  } catch (err) {
    catchError(err, req, res);
  }
};

exports.getUserTaskAssignments = async (req, res) => {
  try {
    const userId = 3;
    const taskAssignments = await TaskAssignment.findAll({
      include: [
        {
          model: Task,
          include: [{ model: TaskGroup }],
        },
        { model: User },
      ],
      where: { user_id: userId },
    });
    return res.status(200).json({
      success: true,
      data: taskAssignments,
    });
  } catch (error) {
    catchError(error, req, res);
  }
};

exports.getTaskAssignmentsByTaskGroupAndRole = async (req, res) => {
  try {
    const { userId, taskGroupId } = req.query;

    let taskGroupIds = [];
    if (Array.isArray(taskGroupId)) {
      taskGroupIds = taskGroupId.map((id) => parseInt(id));
    } else if (taskGroupId) {
      taskGroupIds = taskGroupId.split(",").map((id) => parseInt(id.trim()));
    }
    if (taskGroupIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "taskGroupId is required",
      });
    }
    const tasks = await Task.findAll({
      where: { taskGroupId: { [Op.in]: taskGroupIds } },
      attributes: ["id"],
    });
    const taskIds = tasks.map((task) => task.id);
    if (taskIds.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }
    let taskAssignmentsQuery = {
      where: { task_id: { [Op.in]: taskIds } },
      include: [{ model: Task }],
    };
    if (userId) {
      taskAssignmentsQuery.where.user_id = Number(userId);
    }
    const taskAssignments = await TaskAssignment.findAll(taskAssignmentsQuery);

    res.status(200).json({ success: true, data: taskAssignments });
  } catch (error) {
    catchError(error, req, res);
  }
};

exports.getUserTasksBetweenDates = async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.params;
    if (!userId || !startDate || !endDate) {
      return res.status(400).json({ error: "חסרים פרמטרים חובה" });
    }
    const userIdNum = parseInt(userId);
    if (isNaN(userIdNum)) {
      return res.status(400).json({ error: "סוג ה-userId שגוי" });
    }
    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);
    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      return res.status(400).json({ error: "פורמט תאריך שגוי" });
    }
    const tasks = await Task.findAll({
      include: [
        {
          model: TaskGroup,
          attributes: ["name"],
          include: [{ model: Axis, attributes: ["color"] }],
        },
        { model: User, attributes: ["username"] },
        {
          model: TaskAssignment,
          where: {
            user_id: userIdNum,
            start: { [Op.gte]: startDateTime, [Op.lte]: endDateTime },
          },
          required: true,
          attributes: ["id", "start", "end"],
        },
      ],
      order: [["createdAt", "ASC"]],
    });
    res.json(tasks);
  } catch (error) {
    catchError(error, req, res);
  }
};

exports.getPersonalTasks = async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.params;
    const userIdNum = parseInt(userId);
    if (isNaN(userIdNum)) {
      return res.status(400).json({ error: "סוג ה-userId שגוי" });
    }
    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);
    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      return res.status(400).json({ error: "פורמט תאריך שגוי" });
    }
    const tasks = await Task.findAll({
      include: [
        {
          model: TaskGroup,
          attributes: ["name"],
          include: [{ model: Axis, attributes: ["color"] }],
        },
        { model: User, attributes: ["username"] },
        {
          model: TaskAssignment,
          where: {
            user_id: userIdNum,
            start: { [Op.gte]: startDateTime, [Op.lte]: endDateTime },
          },
          required: true,
          attributes: ["id", "start", "end"],
        },
      ],
      order: [["createdAt", "ASC"]],
    });
  } catch (error) {
    catchError(error, req, res, { function: "taskAssignment.getPersonalTasks" });
  }
};

exports.getTeamTasks = async (req, res) => {
  try {
    const { teamId, startDate, endDate } = req.params;
    if (!teamId || !startDate || !endDate) {
      return res.status(400).json({ error: "חסרים פרמטרים חובה" });
    }
    const teamIdNum = parseInt(teamId);
    if (isNaN(teamIdNum)) {
      return res.status(400).json({ error: "סוג ה-teamId שגוי" });
    }
    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);
    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      return res.status(400).json({ error: "פורמט תאריך שגוי" });
    }
    const tasks = await Task.findAll({
      include: [
        {
          model: TaskGroup,
          attributes: ["name"],
          include: [{ model: Axis, attributes: ["color"] }],
        },
        { model: User, attributes: ["username"] },
        {
          model: TaskAssignment,
          where: {
            team_id: teamIdNum,
            start: { [Op.gte]: startDateTime, [Op.lte]: endDateTime },
          },
          required: true,
          attributes: ["id", "start", "end"],
        },
      ],
      order: [["createdAt", "ASC"]],
    });
    res.json(tasks);
  } catch (error) {
    catchError(error, req, res);
  }
};

exports.getFeedbackFormsForTask = async (req, res) => {
  try {
    const { taskId, teamId } = req.params;
    const { dates, assignmentIds } = req.body;

    if (!assignmentIds) {
      return res.status(400).json({
        error: "assignmentIds is required",
      });
    }

    // Strict integers only: every value below goes into SQL as a bound replacement.
    // (parseInt("5 OR 1=1") is 5, so it must not be used to validate a value that is
    // then used as-is.)
    const toId = (value) => (/^\d+$/.test(String(value).trim()) ? Number(value) : NaN);
    const taskIdNum = toId(taskId);
    const teamIdNum = toId(teamId);
    const assignmentIdsNum = Array.isArray(assignmentIds) ? assignmentIds.map(toId) : [];

    if (
      !Number.isSafeInteger(taskIdNum) ||
      !Number.isSafeInteger(teamIdNum) ||
      assignmentIdsNum.length === 0 ||
      !assignmentIdsNum.every(Number.isSafeInteger)
    ) {
      return res.status(400).json({ success: false, message: "Invalid parameters" });
    }

    const taskExists = await Task.findByPk(taskIdNum);
    if (!taskExists) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // ==========================================
    // 1️⃣ Task Assignments + Users + Task + Feedback (1 query)
    // ==========================================
    const taskAssignmentsQuery = `
      SELECT 
        ta.id AS "taskAssignmentId",
        t.id AS "taskId",
        t.name AS "taskName",
        t."feedbackId" AS "taskFeedbackId",
        fb.id AS "feedbackId",
        fb.name AS "feedbackName",
        fb."select_option_score",
        fb."categoryComment",
        fb."seenGrade",
        u.id AS "userId",
        u.name AS "userName",
        u.militaryid
      FROM "TaskAssignments" ta
      JOIN "Tasks" t ON t.id = ta.task_id
      JOIN "TeamMembers" tm ON tm.id = ta.user_id
      JOIN "Users" u ON u.id = tm.user_id
      LEFT JOIN "Feedbacks" fb ON fb.id = t."feedbackId"
      WHERE ta.id IN (:assignmentIds)
        AND ta.task_id = :taskId
        AND ta.team_id = :teamId
    `;

    const taskAssignments = await sequelize.query(taskAssignmentsQuery, {
      replacements: { assignmentIds: assignmentIdsNum, taskId: taskIdNum, teamId: teamIdNum },
      type: sequelize.QueryTypes.SELECT,
      raw: true,
    });

    if (!taskAssignments || taskAssignments.length === 0) {
      return res.json({
        success: true,
        data: [],
        count: 0,
        message: "No task assignments found",
      });
    }

    const feedbackId = taskAssignments[0].feedbackId;

    // ==========================================
    // 2️⃣ Feedback Answers (1 query)
    // ==========================================
    const feedbackAnswersQuery = `
      SELECT 
        fa.task_assignment_id,
        fa.summary_grade,
        fa.text_comment,
        fa."selectedOptionLabel",
        fa.leaders_only_comment,
        fa.is_viewable
      FROM "FeedbackAnswers" fa
      WHERE fa.task_assignment_id IN (:assignmentIds)
    `;

    const feedbackAnswers = await sequelize.query(feedbackAnswersQuery, {
      replacements: { assignmentIds: assignmentIdsNum },
      type: sequelize.QueryTypes.SELECT,
      raw: true,
    });

    const answersMap = new Map();
    feedbackAnswers.forEach(ans => {
      answersMap.set(ans.task_assignment_id, ans);
    });




    // ==========================================
    // 4️⃣ Feedback Questions + Answers
    // ==========================================
    let allQuestionsData = [];
    if (feedbackId) {
      const questionsQuery = `
    SELECT 
      fq.id AS question_id,
      fq.question_text,
      ta.id AS task_assignment_id,
      fqa.answer_text
    FROM "FeedbackQuestions" fq
    CROSS JOIN (
      SELECT unnest(ARRAY[:assignmentIds])::integer AS id
    ) AS ta
    LEFT JOIN "FeedbackQuestionAnswers" fqa
      ON fqa.question_id = fq.id
      AND fqa.task_assignment_id = ta.id
    WHERE fq.feedback_id = :feedbackId
     ORDER BY fq.id, ta.id
  `;

      allQuestionsData = await sequelize.query(questionsQuery, {
        replacements: { assignmentIds: assignmentIdsNum, feedbackId },
        type: sequelize.QueryTypes.SELECT,
        raw: true,
      });
    }

    // ==========================================
    // 3️⃣ Feedback Categories + Selections
    // ==========================================
    let allCategoriesData = [];
    if (feedbackId) {
      const catsQuery = `
    SELECT 
      fc.id AS category_id,
      fc.category,
      ta.id AS task_assignment_id,
      fcs.selection_type
    FROM "FeedbackCategories" fc
    CROSS JOIN (
      SELECT unnest(ARRAY[:assignmentIds])::integer AS id
    ) AS ta
    LEFT JOIN "FeedbackCategorySelections" fcs
      ON fcs.category_id = fc.id
      AND fcs.task_assignment_id = ta.id
    WHERE fc.feedback_id = :feedbackId
  `;

      allCategoriesData = await sequelize.query(catsQuery, {
        replacements: { assignmentIds: assignmentIdsNum, feedbackId },
        type: sequelize.QueryTypes.SELECT,
        raw: true,
      });
    }

    // ==========================================
    // 5️⃣ עיבוד התוצאות
    // ==========================================
    const results = taskAssignments.map((ta) => {
      const assignmentId = ta.taskAssignmentId;
      const answer = answersMap.get(assignmentId);

      // כעת כל שאלה מופיעה פעם אחת לכל הקצאה
      const relevantQuestions = allQuestionsData
        .filter(q => q.task_assignment_id === assignmentId)
        .map(q => ({
          question_id: q.question_id,
          question_text: q.question_text,
          answer: q.answer_text || "",
        }));

      // קטגוריות
      const categories = allCategoriesData
        .filter(row => row.task_assignment_id === assignmentId)
        .map(row => ({
          id: row.category_id,
          name: row.category,
          selection_type: row.selection_type || null,
        }));

      return {
        taskAssignmentId: assignmentId,
        taskName: ta.taskName,
        feedbackId: ta.feedbackId,
        feedbackName: ta.feedbackName,
        select_option_score: ta.select_option_score,
        userName: ta.userName || "Unknown User",
        militaryid: ta.militaryid,
        userId: ta.userId,
        categoryComment: ta.categoryComment,
        finelScore: answer?.summary_grade || "",
        selectedOptionLabel: answer?.selectedOptionLabel || "",
        comment: answer?.text_comment || "",
        seenGrade: ta.seenGrade,
        feedbackAnswerIsViewable: answer?.is_viewable,
        leaders_only_comment: answer?.leaders_only_comment || "",
        hasUserAnswered: !!answer,
        categories,
        questions: relevantQuestions,
      };
    });
    return res.json({
      success: true,
      data: results,
      count: results.length,
    });

  } catch (error) {
    catchError(error, req, res);
  }
};
//גרסה 2 
// exports.getFeedbackFormsForTask = async (req, res) => {
//   try {
//     const { taskId, teamId } = req.params;
//     const { dates, assignmentIds } = req.body;
//     if (!assignmentIds) {
//       return res.status(400).json({
//         error: "assignmentIds is required",
//       });
//     }

//     if (
//       !taskId ||
//       isNaN(parseInt(taskId)) ||
//       !teamId ||
//       isNaN(parseInt(teamId))
//     ) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid parameters" });
//     }

//     const taskIdNum = parseInt(taskId);
//     const assignmentIdsNum = assignmentIds.map((id) => parseInt(id));

//     let datesFilter = {};
//     if (dates) {
//       const datesArray = Array.isArray(dates) ? dates : dates.split(",");
//       const formattedDates = datesArray.map((d) => new Date(d).toISOString());
//       datesFilter = { [Op.in]: formattedDates };
//     }

//     const taskExists = await Task.findByPk(taskIdNum);
//     if (!taskExists) {
//       return res.status(404).json({
//         success: false,
//         message: "Task not found",
//       });
//     }

//     const taskAssignments = await TaskAssignment.findAll({
//       where: {
//         task_id: taskIdNum,
//         team_id: teamId,
//         id: { [Op.in]: assignmentIdsNum }, 
//         ...(dates && Object.keys(datesFilter).length > 0
//           ? { start: datesFilter }
//           : {}),
//       },
//       include: [
//         {
//           model: Task,
//           attributes: ["name"],
//           include: [
//             {
//               model: Feedback,
//               attributes: [
//                 "name",
//                 "select_option_score",
//                 "id",
//                 "categoryComment",
//                 "seenGrade",
//               ],
//               include: [
//                 {
//                   model: FeedbackCategory,
//                   as: "categories",
//                   attributes: ["category", "id"],
//                   include: [
//                     {
//                       model: FeedbackCategorySelection,
//                       as: "selections",
//                       attributes: ["selection_type", "task_assignment_id"],
//                       where: {
//                         task_assignment_id: { [Op.in]: assignmentIdsNum },
//                       },
//                       required: false,
//                     },
//                   ],
//                 },

//                 {
//                   model: FeedbackQuestion,
//                   as: "questions",
//                   attributes: ["question_text", "id"],
//                   include: [
//                     {
//                       model: FeedbackQuestionAnswer,
//                       as: "questionAnswers",
//                       attributes: ["answer_text", "task_assignment_id"],
//                       where: {
//                         task_assignment_id: { [Op.in]: assignmentIdsNum },
//                       }, // ✅ FILTRE
//                       required: false,
//                     },
//                   ],
//                 },
//                 {
//                   model: FeedbackAnswer,
//                   as: "answers",
//                   attributes: [
//                     "text_comment",
//                     "summary_grade",
//                     "task_assignment_id",
//                     "selectedOptionLabel",
//                     "leaders_only_comment",
//                   ],
//                   where: {
//                     task_assignment_id: { [Op.in]: assignmentIdsNum },
//                   }, 
//                   required: false,
//                 },
//               ],
//             },
//           ],
//         },
//         {
//           model: TeamMember,
//           as: "TeamMember",
//           attributes: ["id"],
//           include: [{ model: User, attributes: ["name", "militaryid", "id"] }],
//         },
//       ],
//     });

//     if (!taskAssignments || taskAssignments.length === 0) {
//       return res.json({
//         success: true,
//         data: [],
//         count: 0,
//         message: "No task assignments found",
//       });
//     }

//     // console.log("taskAssignments",taskAssignments);

//     const results = taskAssignments
//       .map((taskAssignment) => {
//         const task = taskAssignment.Task;
//         const feedback = task?.Feedback;
//         const user = taskAssignment?.TeamMember?.User;

//         if (!task || !feedback) return null;

//         const answerForAssignment = feedback.answers?.[0];

//         return {
//           taskAssignmentId: taskAssignment.id,
//           taskName: task.name || null,
//           feedbackId: feedback.id,
//           feedbackName: feedback.name || null,
//           select_option_score: feedback.select_option_score || null,
//           userName: user ? user.name || "" : "Unknown User",
//           militaryid: user ? user.militaryid : null,
//           userId: user ? user.id : null,
//           userEmail: user ? user.email : null,
//           categoryComment: feedback.categoryComment,
//           finelScore: answerForAssignment?.summary_grade || "",
//           selectedOptionLabel: answerForAssignment?.selectedOptionLabel || "",
//           comment: answerForAssignment?.text_comment || "",
//           seenGrade: feedback.seenGrade,
//           leaders_only_comment: answerForAssignment?.leaders_only_comment || "",
//           hasUserAnswered: !!answerForAssignment,
//           categories:
//             feedback.categories?.map((cat) => ({
//               id: cat.id,
//               name: cat.category || "Unnamed Category",
//               selection_type: cat.selections?.[0]?.selection_type || null,
//             })) || [],
//           questions:
//             feedback.questions
//               ?.filter((q) => q && q.id)
//               .map((q) => ({
//                 question_id: q.id,
//                 question_text: q.question_text || "",
//                 answer: q.questionAnswers?.[0]?.answer_text || "",
//               })) || [],
//         };
//       })
//       .filter((r) => r !== null);


//       console.log("results",results);

//     return res.json({
//       success: true,
//       data: results,
//       count: results.length,
//     });
//   } catch (error) {
//     catchError(error, req, res);
//   }
// };

// exports.getFeedbackFormsForTask = async (req, res) => {
//   try {
//  const { taskId, teamId } = req.params;
//     const { dates, assignmentIds } = req.body;


//     console.log(assignmentIds);
//     console.log(dates);

//       if (!assignmentIds) {
//       return res.status(400).json({ 
//         error: "assignmentIds is required" 
//       });
//     }

//       const datesArray = dates 
//       ? (Array.isArray(dates) ? dates : dates.split(','))
//       : [];

//     // 👈 המרה לפורמט שמתאים ל-JS
//     const formattedDates = datesArray.map(d => new Date(d).toISOString());

//     if (
//       !taskId ||
//       isNaN(parseInt(taskId)) ||
//       !teamId ||
//       isNaN(parseInt(teamId))
//     ) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid parameters" });
//     }
//     const taskIdNum = parseInt(taskId);
//     const taskExists = await Task.findByPk(taskIdNum);
//     if (!taskExists) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Task not found" });
//     }

//     const taskAssignments = await TaskAssignment.findAll({
//       where: { task_id: taskIdNum, team_id: teamId },
//       include: [
//         {
//           model: Task,
//           attributes: ["name"],
//           include: [
//             {
//               model: Feedback,
//               attributes: [
//                 "name",
//                 "select_option_score",
//                 "id",
//                 "categoryComment",
//                 "seenGrade",
//               ],
//               include: [
//                 {
//                   model: FeedbackCategory,
//                   as: "categories",
//                   attributes: ["category", "id"],
//                   include: [
//                     {
//                       model: FeedbackCategorySelection,
//                       as: "selections",
//                       attributes: ["selection_type", "task_assignment_id"],
//                     },
//                   ],
//                 },
//                 {
//                   model: FeedbackQuestion,
//                   as: "questions",
//                   attributes: ["question_text", "id"],
//                   include: [
//                     {
//                       model: FeedbackQuestionAnswer,
//                       as: "questionAnswers",
//                       attributes: ["answer_text", "task_assignment_id"],
//                     },
//                   ],
//                 },
//                 {
//                   model: FeedbackAnswer,
//                   as: "answers",
//                   attributes: [
//                     "text_comment",
//                     "summary_grade",
//                     "task_assignment_id",
//                     "selectedOptionLabel",
//                     "leaders_only_comment",
//                   ],
//                   required: false,
//                   separate: true,
//                 },
//               ],
//             },
//           ],
//         },
//         {
//           model: TeamMember,
//           as: "TeamMember",
//           attributes: ["id"],
//           include: [{ model: User, attributes: ["name", "militaryid", "id"] }],
//         },
//       ],
//     });




//     if (!taskAssignments || taskAssignments.length === 0) {
//       return res.json({
//         success: true,
//         data: [],
//         count: 0,
//         message: "No task assignments found",
//       });
//     }

// const assignmentIdsNum = assignmentIds.map(id => parseInt(id));

// // 👈 פילטור לפי assignmentIds AND dates
// const filteredAssignments = taskAssignments.filter(a => {
//   // פילטור לפי assignmentIds
//   const matchesAssignmentId = assignmentIdsNum.includes(a.id);

//   // פילטור לפי dates (אם יש תאריכים)
//   let matchesDate = true;
//   if (formattedDates.length > 0) {
//     const assignmentDate = new Date(a.start).toISOString();
//     matchesDate = formattedDates.includes(assignmentDate);
//   }

//   return matchesAssignmentId && matchesDate;
// });

//     const results = filteredAssignments
//       .map((taskAssignment) => {
//         const task = taskAssignment.Task;
//         const feedback = task?.Feedback;
//         const user = taskAssignment?.TeamMember?.User;
//         if (!task || !feedback) return null;
//         const answerForAssignment = feedback.answers?.find(
//           (a) => a.task_assignment_id === taskAssignment.id
//         );
//         return {
//           taskAssignmentId: taskAssignment.id,
//           taskName: task.name || null,
//           feedbackId: feedback.id,
//           feedbackName: feedback.name || null,
//           select_option_score: feedback.select_option_score || null,
//           userName: user ? user.name || "" : "Unknown User",
//           militaryid: user ? user.militaryid : null,
//           userId: user ? user.id : null,
//           userEmail: user ? user.email : null,
//           categoryComment: feedback.categoryComment,
//           finelScore: answerForAssignment?.summary_grade || "",
//           selectedOptionLabel: answerForAssignment?.selectedOptionLabel || "",
//           comment: answerForAssignment?.text_comment || "",
//           seenGrade: feedback.seenGrade,
//           leaders_only_comment: answerForAssignment?.leaders_only_comment || "",
//           hasUserAnswered: !!answerForAssignment,
//           categories:
//             feedback.categories?.map((cat) => {
//               const selection = cat.selections?.find(
//                 (s) => s.task_assignment_id === taskAssignment.id
//               );
//               return {
//                 id: cat.id,
//                 name: cat.category || "Unnamed Category",
//                 selection_type: selection?.selection_type || null,
//               };
//             }) || [],
//           questions:
//             feedback.questions
//               ?.map((q) => {
//                 if (!q || !q.id) return null;
//                 const questionAnswers = q.questionAnswers || [];
//                 const matchingQuestion = questionAnswers.find(
//                   (qa) => qa.task_assignment_id === taskAssignment.id
//                 );
//                 return {
//                   question_id: q.id,
//                   question_text: q.question_text || "",
//                   answer: matchingQuestion ? matchingQuestion.answer_text : "",
//                 };
//               })
//               .filter((q) => q !== null) || [],
//         };
//       })
//       .filter((r) => r !== null);



//     return res.json({ success: true, data: results, count: results.length });
//   } catch (error) {
//     catchError(error, req, res);
//   }
// };

exports.getFeedbackByTaskAssignmentId = async (req, res) => {
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
  try {
    const { taskAssignmentId } = req.params;
    if (!taskAssignmentId || isNaN(Number(taskAssignmentId))) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid taskAssignmentId" });
    }
    const assignmentId = Number(taskAssignmentId);
    const assignment = await TaskAssignment.findOne({
      where: { id: assignmentId },
      include: [
        {
          model: Task,
          attributes: ["name"],
          include: [
            {
              model: Feedback,
              attributes: ["id", "name", "select_option_score", "seenGrade"],
              include: [
                {
                  model: FeedbackCategory,
                  as: "categories",
                  attributes: ["id", "category"],
                  include: [
                    {
                      model: FeedbackCategorySelection,
                      as: "selections",
                      attributes: ["selection_type", "task_assignment_id"],
                      where: { task_assignment_id: assignmentId },
                      required: false,
                    },
                  ],
                },
                {
                  model: FeedbackQuestion,
                  as: "questions",
                  attributes: ["id", "question_text"],
                  include: [
                    {
                      model: FeedbackQuestionAnswer,
                      as: "questionAnswers",
                      attributes: ["answer_text", "task_assignment_id"],
                      where: { task_assignment_id: assignmentId },
                      required: false,
                    },
                  ],
                },
                {
                  model: FeedbackAnswer,
                  as: "answers",
                  attributes: [
                    "id",
                    "text_comment",
                    "summary_grade",
                    "selectedOptionLabel",
                    "leaders_only_comment",
                    "task_assignment_id",
                  ],
                  where: { task_assignment_id: assignmentId },
                  required: false,
                  separate: true,
                },
              ],
            },
          ],
        },
        {
          model: TeamMember,
          as: "TeamMember",
          attributes: ["id"],
          include: [{ model: User, attributes: ["id", "name"] }],
        },
      ],
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: `TaskAssignment with id ${assignmentId} not found`,
      });
    }
    const task = assignment.Task;
    const feedback = task?.Feedback;
    const user = assignment?.TeamMember?.User;
    if (!task || !feedback) {
      return res
        .status(500)
        .json({ success: false, message: "Data inconsistency" });
    }
    // const answerForAssignment = (feedback.answers || []).find(
    //   (a) => a.task_assignment_id === assignment.id
    // );
    const answerForAssignment = feedback.answers?.[0];
    const hasAnswered = !!answerForAssignment;

    // const categories = (feedback.categories || []).map((cat) => {
    //   const selection = (cat.selections || []).find(
    //     (s) => s.task_assignment_id === assignment.id
    //   );
    //   return {
    //     id: cat.id,
    //     name: cat.category || "Unnamed Category",
    //     selection_type: selection ? selection.selection_type : null,
    //   };
    // });
    const categories = (feedback.categories || []).map((cat) => ({
      id: cat.id,
      name: cat.category || "Unnamed Category",
      selection_type: cat.selections?.[0]?.selection_type || null,
    }));


    // const questions = (feedback.questions || []).map((q) => {
    //   const qa = (q.questionAnswers || []).find(
    //     (a) => a.task_assignment_id === assignment.id
    //   );
    //   return {
    //     question_id: q.id,
    //     question_text: q.question_text || "",
    //     answer: qa ? qa.answer_text : "",
    //   };
    // });
    const questions = (feedback.questions || []).map((q) => ({
      question_id: q.id,
      question_text: q.question_text || "",
      answer: q.questionAnswers?.[0]?.answer_text || "",
    }));

    const result = {
      taskName: task.name || null,
      feedbackId: feedback.id,
      feedbackName: feedback.name || null,
      seenGrade: feedback.seenGrade,
      select_option_score: feedback.select_option_score ?? null,
      userName: user ? user.name || "" : "Unknown User",
      assignmentDate: assignment.start,
      userId: user?.id ?? null,
      finelScore: feedback.seenGrade? answerForAssignment?.summary_grade:null,
      selectedOptionLabel: answerForAssignment?.selectedOptionLabel ?? null,
      comment: answerForAssignment?.text_comment ?? "",
      leaders_only_comment: hasSpecialPermission
        ? answerForAssignment?.leaders_only_comment
        : undefined,
      hasUserAnswered: hasAnswered,
      categories,
      questions,
    };
    return res.json({
      success: true,
      data: result,
      message: "Feedback fetched successfully",
    });
  } catch (err) {
    catchError(err, req, res);
  }
};

// exports.getFeedbackByTaskAssignmentId = async (req, res) => {
//   const permission = req.headers.selectedpermission;
//   const ROLES = [
//     "COURSE_COMMANDER",
//     "DEVELOPER",
//     "DOMAIN_MANAGER",
//     "OVERLAP",
//     "SYSTEM-ADMIN",
//     "TEAM_COMMANDER",
//   ];
//   const hasSpecialPermission =
//     permission && typeof permission === "string" && ROLES.includes(permission);
//   try {
//     const { taskAssignmentId } = req.params;
//     if (!taskAssignmentId || isNaN(Number(taskAssignmentId))) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid taskAssignmentId" });
//     }
//     const assignmentId = Number(taskAssignmentId);
//     const assignment = await TaskAssignment.findOne({
//       where: { id: assignmentId },
//       include: [
//         {
//           model: Task,
//           attributes: ["name"],
//           include: [
//             {
//               model: Feedback,
//               attributes: ["id", "name", "select_option_score", "seenGrade"],
//               include: [
//                 {
//                   model: FeedbackCategory,
//                   as: "categories",
//                   attributes: ["id", "category"],
//                   include: [
//                     {
//                       model: FeedbackCategorySelection,
//                       as: "selections",
//                       attributes: ["selection_type", "task_assignment_id"],
//                     },
//                   ],
//                 },
//                 {
//                   model: FeedbackQuestion,
//                   as: "questions",
//                   attributes: ["id", "question_text"],
//                   include: [
//                     {
//                       model: FeedbackQuestionAnswer,
//                       as: "questionAnswers",
//                       attributes: ["answer_text", "task_assignment_id"],
//                     },
//                   ],
//                 },
//                 {
//                   model: FeedbackAnswer,
//                   as: "answers",
//                   attributes: [
//                     "id",
//                     "text_comment",
//                     "summary_grade",
//                     "selectedOptionLabel",
//                     "leaders_only_comment",
//                     "task_assignment_id",
//                   ],
//                   required: false,
//                   separate: true,
//                 },
//               ],
//             },
//           ],
//         },
//         {
//           model: TeamMember,
//           as: "TeamMember",
//           attributes: ["id"],
//           include: [{ model: User, attributes: ["id", "name"] }],
//         },
//       ],
//     });
//     if (!assignment) {
//       return res.status(404).json({
//         success: false,
//         message: `TaskAssignment with id ${assignmentId} not found`,
//       });
//     }
//     const task = assignment.Task;
//     const feedback = task?.Feedback;
//     const user = assignment?.TeamMember?.User;
//     if (!task || !feedback) {
//       return res
//         .status(500)
//         .json({ success: false, message: "Data inconsistency" });
//     }
//     const answerForAssignment = (feedback.answers || []).find(
//       (a) => a.task_assignment_id === assignment.id
//     );
//     const hasAnswered = !!answerForAssignment;
//     const categories = (feedback.categories || []).map((cat) => {
//       const selection = (cat.selections || []).find(
//         (s) => s.task_assignment_id === assignment.id
//       );
//       return {
//         id: cat.id,
//         name: cat.category || "Unnamed Category",
//         selection_type: selection ? selection.selection_type : null,
//       };
//     });
//     const questions = (feedback.questions || []).map((q) => {
//       const qa = (q.questionAnswers || []).find(
//         (a) => a.task_assignment_id === assignment.id
//       );
//       return {
//         question_id: q.id,
//         question_text: q.question_text || "",
//         answer: qa ? qa.answer_text : "",
//       };
//     });
//     const result = {
//       taskName: task.name || null,
//       feedbackId: feedback.id,
//       feedbackName: feedback.name || null,
//       seenGrade: feedback.seenGrade,
//       select_option_score: feedback.select_option_score ?? null,
//       userName: user ? user.name || "" : "Unknown User",
//       assignmentDate: assignment.start,
//       userId: user?.id ?? null,
//       finelScore: answerForAssignment?.summary_grade ?? null,
//       selectedOptionLabel: answerForAssignment?.selectedOptionLabel ?? null,
//       comment: answerForAssignment?.text_comment ?? "",
//       leaders_only_comment: hasSpecialPermission
//         ? answerForAssignment.leaders_only_comment
//         : undefined,
//       hasUserAnswered: hasAnswered,
//       categories,
//       questions,
//     };
//     return res.json({
//       success: true,
//       data: result,
//       message: "Feedback fetched successfully",
//     });
//   } catch (err) {
//     catchError(err, req, res);
//   }
// };

exports.markAsCompleted = async (req, res) => {
  try {
    const { id } = req.params;
    const taskAssignment = await TaskAssignment.findByPk(id);

    if (!taskAssignment) {
      logger.warn("Task assignment not found for completion", {
        taskAssignmentId: id,
        userId: req.headers["x-user-id"],
      });
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // בדיקה שלא הושלם כבר
    if (taskAssignment.completed_at) {
      logger.warn("Task already completed", {
        taskAssignmentId: id,
        taskId: taskAssignment.task_id,
        completedAt: taskAssignment.completed_at,
        userId: req.headers["x-user-id"],
      });
      return res.status(400).json({
        success: false,
        message: "Task already completed",
      });
    }

    const updatedTaskAssignment = await taskAssignment.update(
      {
        completed_at: new Date(),
      },
      {
        where: { id },
        returning: true,
      }
    );

    logger.info("Task marked as completed", {
      taskAssignmentId: id,
      taskId: taskAssignment.task_id,
      userId: req.headers["x-user-id"],
    });

    return res.status(200).json({
      success: true,
      message: "Task completed successfully",
      data: updatedTaskAssignment[1],
    });
  } catch (error) {
    logger.error("Failed to mark task as completed", {
      taskAssignmentId: req.params.id,
      error: error.message,
      userId: req.headers["x-user-id"],
    });
    catchError(error, req, res);
  }
};

exports.cancelSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const taskAssignment = await TaskAssignment.findByPk(id);

    if (!taskAssignment) {
      logger.warn("Task assignment not found for cancellation", {
        taskAssignmentId: id,
        userId: req.headers["x-user-id"],
      });
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (!taskAssignment.completed_at) {
      logger.warn("Task was not submitted yet", {
        taskAssignmentId: id,
        taskId: taskAssignment.task_id,
        userId: req.headers["x-user-id"],
      });
      return res.status(400).json({
        success: false,
        message: "Task was not submitted yet",
      });
    }

    const updatedTaskAssignment = await taskAssignment.update(
      {
        completed_at: null,
      },
      {
        where: { id },
        returning: true,
      }
    );

    logger.info("Task submission cancelled", {
      taskAssignmentId: id,
      taskId: taskAssignment.task_id,
      userId: req.headers["x-user-id"],
    });

    return res.status(200).json({
      success: true,
      message: "Task submission cancelled successfully",
      data: updatedTaskAssignment[1],
    });
  } catch (error) {
    logger.error("Failed to cancel task submission", {
      taskAssignmentId: req.params.id,
      error: error.message,
      userId: req.headers["x-user-id"],
    });
    catchError(error, req, res);
  }
};

exports.getTaskAssignmentsByTeam = async (req, res) => {
  try {
    const { teamId } = req.params;

    const taskAssignments = await sequelize.query(
      `
      SELECT 
        ta.id,
        ta.task_id,
        ta.team_id,
        ta.start,
        ta.end,
        ta.completed,
        t.name as "taskName",
        t.color as "taskColor",
        t.status as "taskStatus",
        t.description as "taskDescription",
        t."recommendedTime"
      FROM "TaskAssignments" ta
      JOIN "Tasks" t ON t.id = ta.task_id
      WHERE ta.team_id = :teamId
      ORDER BY ta.end ASC NULLS LAST
      `,
      {
        replacements: { teamId },
        type: QueryTypes.SELECT,
        raw: true,
      }
    );

    const formatted = taskAssignments.map((ta) => ({
      id: ta.id,
      task_id: ta.task_id,
      team_id: ta.team_id,
      start: ta.start,
      end: ta.end,
      completed: ta.completed,
      status: ta.assignmentStatus,
      task: {
        id: ta.task_id,
        name: ta.taskName,
        color: ta.taskColor,
        status: ta.taskStatus,
        description: ta.taskDescription,
        recommendedTime: ta.recommendedTime,
        courseName: ta.courseName,
        courseColor: ta.courseColor,
      },
    }));

    res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error("Error getting task assignments by team:", error);
    catchError(error, req, res, { function: "taskAssignment.getTaskAssignmentsByTeam" });
  }
};

exports.getTeamCompletedTasks = async (req, res) => {
  try {
    const { teamId, courseBatchId } = req.query;
    const whereCondition = {
      team_id: teamId,
      member_role: "STUDENT",
    };
    if (courseBatchId) {
      whereCondition.course_batch_id = courseBatchId;
    }
    const results = await TeamMember.findAll({
      attributes: [
        [sequelize.col("User.name"), "name"],
        [sequelize.col("User.militaryid"), "militaryid"],

        [
          sequelize.fn(
            "SUM",
            sequelize.literal(`CASE WHEN "TaskAssignments"."completed_at" IS NOT NULL 
            AND "TaskAssignments->Task"."status" = 'operational' THEN 1 ELSE 0 END`)
          ),
          "completedTasks",
        ],

        [
          sequelize.fn(
            "SUM",
            sequelize.literal(`CASE WHEN "TaskAssignments"."completed_at" IS NULL 
            AND "TaskAssignments"."end" < NOW() THEN 1 ELSE 0 END`)
          ),
          "lateTasks",
        ],

        [
          sequelize.fn(
            "SUM",
            sequelize.literal(`CASE WHEN "TaskAssignments"."completed_at" IS NOT NULL 
            AND "TaskAssignments->Task"."status" = 'assignment_bank' THEN 1 ELSE 0 END`)
          ),
          "offlineTasksCompleted",
        ],

        [
          sequelize.fn(
            "AVG",
            sequelize.literal(`CASE WHEN "TaskAssignments->formSubmissions"."score" IS NOT NULL 
            THEN "TaskAssignments->formSubmissions"."score" END`)
          ),
          "averageScore",
        ],
      ],
      include: [
        {
          model: User,
          as: "User",
          attributes: [],
        },
        {
          model: TaskAssignment,
          as: "TaskAssignments",
          attributes: [],
          required: false,
          include: [
            {
              model: Task,
              as: "Task",
              attributes: [],
            },
            {
              model: FormSubmission,
              as: "formSubmissions",
              attributes: [],
              required: false,
            },
          ],
        },
      ],
      where: whereCondition,
      group: ["TeamMember.id", "User.id", "User.name", "User.militaryid"],
      raw: true,
      subQuery: false,
    });

    const formattedData = results.map((item) => ({
      name: item.name || "Unknown",
      militaryid: parseInt(item.militaryid) || 0,
      completedTasks: parseInt(item.completedTasks) || 0,
      lateTasks: parseInt(item.lateTasks) || 0,
      offlineTasksCompleted: parseInt(item.offlineTasksCompleted) || 0,
      averageScore: item.averageScore
        ? parseFloat(item.averageScore).toFixed(2)
        : null,
    }));

    return res.status(200).json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch team tasks",
    });
  }
};

exports.getDuplicatedTasks = async (req, res) => {
  try {
    const { teamId, selectedCourseBatch } = req.query;

    const teamMemberWhere = {};
    if (teamId) {
      teamMemberWhere.team_id = teamId;
    }
    if (selectedCourseBatch) {
      teamMemberWhere.course_batch_id = selectedCourseBatch;
    }

    const occurrences = await TaskAssignmentOccurrence.findAll({
      attributes: ["id", "task_assignment_id"],
      include: [
        {
          model: TaskAssignment,
          as: "parentAssignment",
          attributes: ["id"],
          required: true,
          include: [
            {
              model: Task,
              as: "Task",
              attributes: ["id", "name"],
              required: true,
            },
            {
              model: TeamMember,
              as: "TeamMember",
              where: teamMemberWhere,
              attributes: ["id", "user_id"],
              required: true,
              include: [
                {
                  model: User,
                  as: "User",
                  attributes: ["id", "name"],
                  required: true,
                },
                {
                  model: Team,
                  attributes: ["name"],
                },
              ],
            },
          ],
        },
      ],
      where: {
        task_assignment_id: {
          [Op.ne]: null,
        },
      },
      raw: false,
      nest: true,
    });

    if (!occurrences || occurrences.length === 0) {
      res.json({
        success: true,
        data: [],
      });
      return;
    }

    const result = {};

    occurrences.forEach((item) => {
      if (!item.parentAssignment?.TeamMember?.User?.name) {
        return;
      }

      const userName = item.parentAssignment.TeamMember.User.name;
      const missionName = item.parentAssignment.Task.name;
      const teamName =
        item.parentAssignment.TeamMember.Team?.name || "ללא צוות";

      if (!result[userName]) {
        result[userName] = {
          name: userName,
          teamName: teamName,
          tasks: [],
        };
      }

      const existingTask = result[userName].tasks.find(
        (t) => t.taskName === missionName
      );

      if (existingTask) {
        existingTask.count++;
      } else {
        result[userName].tasks.push({
          taskName: missionName,
          count: 1,
        });
      }
    });

    const finalResult = Object.values(result);

    res.json({
      success: true,
      data: finalResult,
    });
  } catch (error) {
    console.error("Error:", error);
    catchError(error, req, res, { function: "taskAssignment.getDuplicatedTasks" });
  }
};


// GET /api/task-assignment/exists?taskId=1&teamMemberId=2&teamId=3

exports.checkTaskAssignmentExists = async (req, res) => {
  try {
    const { taskId, teamMemberId, teamId } = req.query;

    const assignment = await TaskAssignment.findOne({
      where: {
        task_id: taskId,
        team_id: teamId,
      },
    });

    res.json({ exists: !!assignment });
  } catch (error) {
    catchError(error, req, res);
  }
};
exports.checkUserTaskAssignmentExists = async (req, res) => {
  try {
    const { taskId, teamId, teamMemberId } = req.query;

    const assignment = await TaskAssignment.findOne({
      where: {
        task_id: taskId,
        team_id: teamId,
        user_id: teamMemberId
      },
    });

    res.json({ exists: !!assignment });
  } catch (error) {
    catchError(error, req, res);
  }
}
exports.updateNoteForStudent = async (req, res) => {
  const { taskAssignmentId } = req.params;
  const { note_for_student } = req.body;
  const t = await sequelize.transaction();

  try {
    if (!taskAssignmentId || isNaN(parseInt(taskAssignmentId))) {
      await t.rollback();
      return res.status(400).json({
        message: "Invalid task assignment ID",
      });
    }

    const assignment = await TaskAssignment.findOne({
      where: {
        id: taskAssignmentId,
      },
      raw: true,
      transaction: t,
    });

    if (!assignment) {
      await t.rollback();
      return res.status(404).json({
        message: "Task assignment not found",
      });
    }

    await TaskAssignment.update(
      {
        note_for_student: note_for_student || null,
        updatedAt: new Date(),
      },
      {
        where: {
          id: taskAssignmentId,
        },
        transaction: t,
      }
    );

    await t.commit();

    return res.status(200).json({
      message: "Note updated successfully",
      task_assignment_id: parseInt(taskAssignmentId),
      note_for_student: note_for_student || null,
    });
  } catch (err) {
    await t.rollback();
    catchError(err, req, res);
  }
};

exports.getNoteForStudent = async (req, res) => {
  const { taskAssignmentId } = req.params;
  const t = await sequelize.transaction();

  try {
    if (!taskAssignmentId || isNaN(parseInt(taskAssignmentId))) {
      await t.rollback();
      return res.status(400).json({
        message: "Invalid task assignment ID",
      });
    }

    const assignment = await TaskAssignment.findOne({
      where: {
        id: taskAssignmentId,
      },
      attributes: ["id", "note_for_student", "user_id", "task_id"],
      raw: true,
      transaction: t,
    });

    if (!assignment) {
      await t.rollback();
      return res.status(404).json({
        message: "Task assignment not found",
      });
    }

    await t.commit();

    return res.status(200).json({
      task_assignment_id: assignment.id,
      note_for_student: assignment.note_for_student || null,
      has_note: assignment.note_for_student !== null,
    });
  } catch (err) {
    await t.rollback();
    catchError(err, req, res);
  }
};