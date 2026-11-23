const taskassignment = require("../../models/taskassignment");

const {
  FeedbackCategory,
  Feedback,
  FeedbackAnswer,
  FeedbackQuestion,
  FeedbackCategorySelection,
  FeedbackQuestionAnswer,
  TaskAssignment,
  TeamMember,
  Task,
  Course,
  Team,
  User,
  TeamCourseBatch,
  TaskGroup,
  Axis,
} = require("../../models");
const { Op, where, and, or } = require("sequelize");
const logger = require("../utils/logger");
const { catchError } = require("../utils/errorHandler");
const { sequelize } = require("../../models/index");

exports.createFeedback = async (req, res) => {
  try {
    const {
      name,
      select_option_score,
      team_id,
      file,
      courseId,
      created_by,
      is_active,
      categories,
      questions,
      categoryComment,
      seenGrade,
      leaders_only_comment,
    } = req.body;

    const feedback = await Feedback.create({
      name,
      select_option_score,
      team_id,
      file,
      courseId,
      created_by,
      is_active,
      categoryComment,
      seenGrade,
      leaders_only_comment,
    });

    if (categories && categories.length > 0) {
      const categoriesWithFeedbackId = categories.map((category) => ({
        ...category,
        feedback_id: feedback.id,
      }));

      await FeedbackCategory.bulkCreate(categoriesWithFeedbackId);
    }

    if (questions && questions.length > 0) {
      const questionsWithFeedbackId = questions.map((question) => ({
        ...question,
        feedback_id: feedback.id,
      }));

      await FeedbackQuestion.bulkCreate(questionsWithFeedbackId);
    }

    logger.info("Feedback created", {
      feedbackId: feedback.id,
      name,
      courseId,
      teamId: team_id,
      categoriesCount: categories?.length || 0,
      questionsCount: questions?.length || 0,
      userId: req.headers["x-user-id"],
    });

    res.status(201).json({
      success: true,
      message: "Feedback created successfully",
      data: feedback,
    });
  } catch (error) {
    catchError(error, req, res, { function: "createFeedback" });
  }
};

exports.getFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    const feedback = await Feedback.findByPk(id, {
      include: [
        {
          model: FeedbackCategory,
          as: "categories",
        },
        {
          model: FeedbackQuestion,
          as: "questions",
        },
        {
          model: Course,
          as: "Course",
          attributes: ["name"],
        },
        {
          model: Team,
          as: "team",
          attributes: ["name"],
        },
      ],
    });

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      });
    }

    res.json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    catchError(error, req, res, {
      function: "getFeedback",
      feedbackId: req.params.id,
    });
  }
};

exports.updateFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const feedback = await Feedback.findByPk(id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      });
    }

    await feedback.update(updateData);

    if (updateData.categories) {
      await FeedbackCategory.destroy({
        where: { feedback_id: id },
      });

      // Create new categories
      const categoriesWithFeedbackId = updateData.categories.map(
        (category) => ({
          ...category,
          feedback_id: id,
        })
      );

      await FeedbackCategory.bulkCreate(categoriesWithFeedbackId);
    }

    if (updateData.questions) {
      await FeedbackQuestion.destroy({
        where: { feedback_id: id },
      });

      const questionsWithFeedbackId = updateData.questions.map((question) => ({
        ...question,
        feedback_id: id,
      }));

      await FeedbackQuestion.bulkCreate(questionsWithFeedbackId);
    }

    logger.info("Feedback updated", {
      feedbackId: id,
      updatedFields: Object.keys(updateData),
      userId: req.headers["x-user-id"],
    });

    res.json({
      success: true,
      message: "Feedback updated successfully",
      data: feedback,
    });
  } catch (error) {
    catchError(error, req, res, {
      function: "updateFeedback",
      feedbackId: req.params.id,
    });
  }
};

exports.deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    const feedback = await Feedback.findByPk(id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      });
    }

    // Delete associated categories and questions
    await FeedbackCategory.destroy({
      where: { feedback_id: id },
    });

    await FeedbackQuestion.destroy({
      where: { feedback_id: id },
    });

    // Delete feedback
    await feedback.destroy();

    logger.info("Feedback deleted", {
      feedbackId: id,
      name: feedback.name,
      courseId: feedback.courseId,
      userId: req.headers["x-user-id"],
    });

    res.json({
      success: true,
      message: "Feedback deleted successfully",
    });
  } catch (error) {
    catchError(error, req, res, {
      function: "deleteFeedback",
      feedbackId: req.params.id,
    });
  }
};

exports.getAllFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.findAll({
      include: [
        {
          model: FeedbackCategory,
          as: "categories",
        },
        {
          model: FeedbackQuestion,
          as: "questions",
        },
      ],
    });

    res.json({
      success: true,
      data: feedbacks,
    });
  } catch (error) {
    catchError(error, req, res, { function: "getAllFeedbacks" });
  }
};

const replaceCategorySelections = async (
  feedbackId,
  taskAssignId,
  categories
) => {
  await FeedbackCategorySelection.destroy({
    where: { feedback_id: feedbackId, task_assignment_id: taskAssignId },
  });

  if (Array.isArray(categories) && categories.length) {
    const rows = categories.map((cat) => ({
      ...cat,
      feedback_id: feedbackId,
      task_assignment_id: taskAssignId,
    }));
    await FeedbackCategorySelection.bulkCreate(rows);
  }
};

const upsertFeedbackAnswer = async (feedbackId, payload) => {
  const {
    task_assignment_id,
    comment,
    finalScore,
    selectedOptionLabel,
    categoryComment,
    team_member_id,
    leaders_only_comment,
    isViewable,
  } = payload;
  // Find existing FeedbackAnswer
  const existingAnswer = await FeedbackAnswer.findOne({
    where: { feedback_id: feedbackId, task_assignment_id },
  });

  if (existingAnswer) {
    // UPDATE existing instead of destroy + create
    await existingAnswer.update({
      text_comment: comment,
      summary_grade: finalScore,
      selectedOptionLabel,
      categoryComment: categoryComment || null,
      team_member_id,
      leaders_only_comment: leaders_only_comment,
      is_viewable: isViewable,
    });

    return existingAnswer; // Return SAME object with SAME id
  } else {
    // Only create new if it doesn't exist its mean new feedback answer
    return FeedbackAnswer.create({
      feedback_id: feedbackId,
      task_assignment_id,
      text_comment: comment,
      summary_grade: finalScore,
      selectedOptionLabel,
      file: null,
      categoryComment: categoryComment || null,
      team_member_id,
      leaders_only_comment: leaders_only_comment,
      is_viewable: isViewable,
    });
  }
};

const replaceQuestionAnswers = async (taskAssignId, answers) => {
  await FeedbackQuestionAnswer.destroy({
    where: { task_assignment_id: taskAssignId },
  });

  const rows = answers
    .filter((a) => a.answer && a.answer.trim().length > 0)
    .map((a) => ({
      task_assignment_id: a.task_assignment_id,
      question_id: a.question_id,
      answer_text: a.answer,
    }));

  if (rows.length) {
    await FeedbackQuestionAnswer.bulkCreate(rows);
  }
};

exports.updateFeedbackComplete = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  const { semesterId, teamId, userId } = req.query;
  let feedback = null;

  try {
    if (!updateData || !semesterId || !teamId || !userId) {
      return res.json({
        success: true,
        message: "Nothing to update",
        data: null,
      });
    }

    const teamMember = await TeamMember.findOne({
      where: {
        team_id: teamId,
        user_id: userId,
        course_batch_id: semesterId,
      },
    });

    updateData.team_member_id = teamMember ? teamMember.id : null;

    await replaceCategorySelections(
      id,
      updateData.task_assignment_id,
      updateData.categories
    );

    feedback = await upsertFeedbackAnswer(id, updateData);



    if (Array.isArray(updateData.answers) && updateData.answers.length) {
      await replaceQuestionAnswers(
        updateData.task_assignment_id,
        updateData.answers
      );
    }

    logger.info("Feedback complete updated", {
      feedbackId: id,
      taskAssignmentId: updateData.task_assignment_id,
      semesterId,
      teamId,
      userId,
      userId_header: req.headers["x-user-id"],
    });

    res.json({
      success: true,
      message: "Feedback updated successfully",
      data: feedback,
    });
  } catch (error) {
    catchError(error, req, res, {
      function: "updateFeedbackComplete",
      feedbackId: id,
    });
  }
};
exports.updateFeedbackAnswerViewable = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  try {
    const feedback = await upsertFeedbackAnswer(id, updateData);
    res.json({
      success: true,
      message: "Feedback updated successfully",
      data: feedback,
    });
  } catch (error) {
    catchError(error, req, res, {
      function: "updateFeedbackComplete",
      feedbackId: id,
    });
  }
};

exports.getAllFeedbacksWithDetailsByCourseIdOrTeamId = async (req, res) => {
  const courseId = req.params.courseId;
  const teamId = req.query.teamId;
  const courseBatchId = req.params.courseBatchId;
  const { dateFilter } = req.query; // 🆕 פרמטר לסינון

  try {
    // ✅ ולידציות
    if (!courseId || isNaN(courseId) || courseId == 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid courseId provided",
      });
    }

    if (!courseBatchId || isNaN(courseBatchId) || courseBatchId == 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid courseBatchId provided",
      });
    }

    const teamIdNum = teamId && !isNaN(teamId) ? parseInt(teamId) : null;

    // 🆕 1. קודם שליפת רשימת ה feedbacks בלבד
    const feedbacks = await Feedback.findAll({
      attributes: ["id", "name", "createdAt", "team_id", "is_active"],
      where: {
        courseId: courseId,
        ...(teamIdNum && {
          [Op.or]: [{ team_id: teamIdNum }, { team_id: null }],
        }),
      },
      // ✅ limit לבטיחות
      limit: 100,
      order: [["createdAt", "DESC"]],
    });

    if (!feedbacks.length) {
      return res.json({ success: true, data: [], count: 0 });
    }

    const feedbackIds = feedbacks.map((f) => f.id);

    // 🆕 2. שליפת קטגוריות בנפרד
    const categories = await FeedbackCategory.findAll({
      where: { feedback_id: feedbackIds },
      include: [
        {
          model: FeedbackCategorySelection,
          as: "selections",
          attributes: ["id", "selection_type", "task_assignment_id"],
        },
      ],
    });

    // ארגון קטגוריות לפי feedback_id
    const categoriesByFeedback = {};
    categories.forEach((cat) => {
      if (!categoriesByFeedback[cat.feedback_id]) {
        categoriesByFeedback[cat.feedback_id] = [];
      }
      categoriesByFeedback[cat.feedback_id].push(cat);
    });

    // 🆕 3. שליפת תשובות עם כל הקשרים (כבר מסונן בשאילתה!)
    const feedbackAnswers = await FeedbackAnswer.findAll({
      attributes: [
        "id",
        "summary_grade",
        "text_comment",
        "task_assignment_id",
        "feedback_id",
      ],
      where: { feedback_id: feedbackIds },
      include: [
        {
          model: TaskAssignment,
          as: "taskAssignment",
          attributes: ["id", "user_id", "start"],
          required: true, // 🆕 required=true מסנן כבר בשאילתה!
          include: [
            {
              model: TeamMember,
              as: "TeamMember",
              attributes: ["id", "user_id"],
              where: {
                course_batch_id: courseBatchId,
                ...(teamIdNum && { team_id: teamIdNum }),
              },
              required: true,
              include: [{ model: User, attributes: ["name"] }],
            },
            {
              model: Task,
              attributes: ["name"],
            },
          ],
        },
      ],
    });
    // need to return here the start and take from the dashboard feddbacks

    // 🆕 4. ארגון תשובות לפי feedback_id
    const answersByFeedback = {};
    feedbackAnswers.forEach((answer) => {
      if (!answersByFeedback[answer.feedback_id]) {
        answersByFeedback[answer.feedback_id] = [];
      }
      answersByFeedback[answer.feedback_id].push(answer);
    });

    // 🆕 5. בניית התוצאה - ללא לולאות מקוננות מיותרות
    const result = feedbacks.map((feedback) => {
      const feedbackAnswers = answersByFeedback[feedback.id] || [];
      const feedbackCategories = categoriesByFeedback[feedback.id] || [];

      // מיפוי task_assignment_ids לספירה
      const taskAssignmentIds = [
        ...new Set(feedbackAnswers.map((a) => a.task_assignment_id)),
      ];

      // ספירות קטגוריות
      const categoryCounts = {};
      feedbackCategories.forEach((cat) => {
        categoryCounts[cat.category] = { improvement: 0, preservation: 0 };
      });

      feedbackAnswers.forEach((answer) => {
        feedbackCategories.forEach((cat) => {
          const selections = cat.selections || [];
          selections.forEach((sel) => {
            if (
              sel.task_assignment_id === answer.task_assignment_id &&
              sel.selection_type
            ) {
              if (categoryCounts[cat.category]) {
                categoryCounts[cat.category][sel.selection_type]++;
              }
            }
          });
        });
      });

      return {
        feedbackId: feedback.id,
        feedbackName: feedback.name || "",
        feedbackCreatedAt: feedback.createdAt,
        teamId: feedback.team_id,
        is_active: feedback.is_active,
        categories: feedbackCategories.map((cat) => ({
          categoryName: cat.category,
          counts: categoryCounts[cat.category] || {
            improvement: 0,
            preservation: 0,
          },
          selections: cat.selections
            .filter((sel) => taskAssignmentIds.includes(sel.task_assignment_id))
            .map((sel) => ({
              id: sel.id,
              selection_type: sel.selection_type,
            })),
        })),
        answers: feedbackAnswers.map((answer) => ({
          id: answer.id,
          summary_grade: answer.summary_grade,
          text_comment: answer.text_comment,
          taskAssignmentId: answer.taskAssignment?.id,
          memberId: answer.taskAssignment?.TeamMember?.id,
          memberName: answer.taskAssignment?.TeamMember?.User?.name || null,
          taskName: answer.taskAssignment?.Task?.name || null,
          taskAssignmentsStart: answer.taskAssignment.start
        })),
      };
    });

    return res.json({
      success: true,
      data: result,
      count: result.length,
    });
  } catch (error) {
    catchError(error, req, res, {
      function: "getAllFeedbacksWithDetailsByCourseIdOrTeamId",
      courseId,
    });
  }
};

exports.getMissedFeedbacks = async (req, res) => {
  const { teamMemberId } = req.params;

  try {
    const taskAssignments = await TaskAssignment.findAll({
      where: {
        user_id: teamMemberId,
      },
      include: [
        {
          model: Task,
          required: true,
          attributes: ["id", "name"], // ← הוספתי "id" כדי לקבל את taskId
          include: [
            {
              model: Feedback,
              required: true,
              attributes: ["id", "name"],
            },
          ],
        },
        {
          model: FeedbackAnswer,
          as: "answers",
          required: false,
        },
      ],
    });

    // Format response - only show TAs without answers
    const result = taskAssignments
      .filter((ta) => !ta.answers || ta.answers.length === 0)
      .map((ta) => ({
        id: ta.id,                 // מורשת: מזהה השיבוץ (TaskAssignment.id)
        assignmentId: ta.id,       // מזהה השיבוץ
        assignmentIds: [ta.id],    // לדרישה שלך - אם תצטרך מערך
        taskId: ta.Task?.id,       // ← חדש: ה-ID של המשימה
        taskName: ta.Task?.name,
        start: ta.start,           // תאריך תחילת השיבוץ
        end: ta.end,               // תאריך סיום השיבוץ
        feedbackId: ta.Task?.Feedback?.id,
        feedbackName: ta.Task?.Feedback?.name,
      }));

    return res.status(200).json({
      success: true,
      count: result.length,
      data: result,
    });
  } catch (err) {
    return catchError(err, req, res, { function: "feedback.getMissedFeedbacks" });
  }
};
exports.getFeedbacksByUserId = async (req, res) => {
  const { teamMemberId } = req.params;
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

  const feedbackAnswerWhere = hasSpecialPermission ? {} : { is_viewable: true };

  // רק שדות שבאמת יוצאים בפלט
  const FEEDBACK_ATTRS = ["id", "name", "createdAt", "seenGrade"];

  try {
    const teamMember = await TeamMember.findOne({
      where: { id: teamMemberId },
      attributes: ["id", "team_id", "course_batch_id"],
    });

    if (!teamMember) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    let blockDates = null;
    if (!hasSpecialPermission) {
      blockDates = await TeamCourseBatch.findOne({
        where: {
          team_id: teamMember.team_id,
          course_batch_id: teamMember.course_batch_id,
        },
        attributes: ["blockFromDate", "blockToDate"],
      });
    }

    // ---------- 1) TaskAssignments של החבר ----------
    // Connectivity: TeamMember.hasMany(TaskAssignment, {foreignKey:"user_id"})
    // ⇒ TaskAssignment.user_id = TeamMember.id  → סינון ישיר, בלי JOIN
    const taskAssignments = await TaskAssignment.findAll({
      where: { user_id: teamMemberId },
      attributes: ["id", "start", "completed_at", "completed"],
      include: [
        {
          model: Task,
          required: true,
          where: { feedbackId: { [Op.ne]: null } },
          attributes: ["id", "name", "status", "taskGroupId"],
          include: [
            {
              model: TaskGroup,
              attributes: ["id", "name"],
              include: [
                { model: Axis, as: "Axis", attributes: ["id", "name", "color"] },
              ],
            },
            {
              model: Feedback,
              as: "Feedback",
              attributes: FEEDBACK_ATTRS,
              required: false,
            },
          ],
        },
      ],
    });

    if (taskAssignments.length === 0) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    const assignmentIds = taskAssignments.map((ta) => ta.id);

    // ---------- 2) תשובות בלבד (הסוקר מוצג דרך FeedbackAnswer.team_member_id) ----------
    // Connectivity: FeedbackAnswer.belongsTo(TaskAssignment, {FK:"task_assignment_id"})
    const answers = await FeedbackAnswer.findAll({
      where: {
        task_assignment_id: { [Op.in]: assignmentIds },
        ...feedbackAnswerWhere, // יורד ל-SQL
      },
      attributes: [
        "id",
        "feedback_id",
        "task_assignment_id",
        "summary_grade",
        "team_member_id",
        "is_viewable",
        // text_comment / leaders_only_comment הושמטו - לא בפלט
      ],
      include: [
        {
          model: TeamMember,
          as: "teamMember",
          attributes: ["id"],
          include: [
            {
              model: User,
              attributes: ["name"],
            },
          ],
        },
      ],
    });

    // ---------- 3) Feedback + קטגוריות, נטענים פעם אחת בלבד ----------
    const feedbackIds = [...new Set(answers.map((a) => a.feedback_id))].filter(Boolean);

    const feedbacks = feedbackIds.length
      ? await Feedback.findAll({
          where: { id: { [Op.in]: feedbackIds } },
          attributes: FEEDBACK_ATTRS,
        })
      : [];
    const feedbackMap = new Map(feedbacks.map((f) => [f.id, f]));

    // Connectivity: Feedback.hasMany(FeedbackCategorySelection, {FK:"feedback_id"})
    const selections = feedbackIds.length
      ? await FeedbackCategorySelection.findAll({
          where: { feedback_id: { [Op.in]: feedbackIds } },
          attributes: [
            "id",
            "selection_type",
            "category_id",
            "task_assignment_id",
            "feedback_id",
          ],
          include: [
            {
              model: FeedbackCategory,
              as: "category",
              attributes: ["id", "category"],
            },
          ],
        })
      : [];

    const selectionsByFeedback = new Map();
    selections.forEach((s) => {
      const key = s.feedback_id;
      if (!selectionsByFeedback.has(key)) selectionsByFeedback.set(key, []);
      selectionsByFeedback.get(key).push(s);
    });

    // שקול ל-required:true על feedback בגרסה המקורית
    // (answer עם feedback לא קיים — לא נכלל)
    const validAnswers = answers.filter((a) => feedbackMap.has(a.feedback_id));
    const answersByAssignment = new Map();
    validAnswers.forEach((a) => {
      const key = a.task_assignment_id;
      if (!answersByAssignment.has(key)) answersByAssignment.set(key, []);
      answersByAssignment.get(key).push(a);
    });

    // ---------- 4) הרכבה — אותו לוגיקה בדיוק ----------
    const result = [];

    taskAssignments.forEach((ta) => {
      const taObj = ta.toJSON();

      if (!hasSpecialPermission) {
        const hasBlockDates = blockDates?.blockFromDate && blockDates?.blockToDate;
        const taskStart = taObj.start;
        const taskStatus = taObj.Task?.status;
        if (hasBlockDates && taskStatus !== "assignment_bank") {
          if (
            taskStart &&
            taskStart >= blockDates.blockFromDate &&
            taskStart <= blockDates.blockToDate
          ) {
            return;
          }
        }
      }

      const taskFeedback = taObj.Task?.Feedback;
      const taAnswers = answersByAssignment.get(ta.id) || [];

      if (taAnswers.length > 0) {
        taAnswers.forEach((answer) => {
          const feedback = feedbackMap.get(answer.feedback_id) || taskFeedback;

          const selectionsForAssignment =
            (selectionsByFeedback.get(answer.feedback_id) || []).filter(
              (s) => s.task_assignment_id === answer.task_assignment_id
            );

          const grouped = {};
          selectionsForAssignment.forEach((s) => {
            const catId = s.category_id;
            if (!grouped[catId]) {
              grouped[catId] = {
                categoryId: catId,
                categoryName: s.category?.category ?? "",
                counts: { improvement: 0, preservation: 0 },
              };
            }
            if (s.selection_type === "improvement") grouped[catId].counts.improvement++;
            else if (s.selection_type === "preservation") grouped[catId].counts.preservation++;
          });
          const categoriesWithCounts = Object.values(grouped).map((c) => ({
            categoryName: c.categoryName,
            counts: c.counts,
          }));
          const axisName = taObj.Task?.TaskGroup?.Axis?.name ?? null;
          const axisColor = taObj.Task?.TaskGroup?.Axis?.color ?? null;
          const taskGroupName = taObj.Task?.TaskGroup?.name ?? null;

          result.push({
            feedbackId: feedback?.id ?? null,
            feedbackName: feedback?.name ?? null,
            feedbackCreatedAt: feedback?.createdAt ?? null,
            taskAssignmentId: answer.task_assignment_id,
            formStartDate: taObj.start || null,
            taskName: taObj.Task.name,
            taskId: taObj.Task.id,
            taskAssignmentsStart: taObj.start,
            seenGrade: feedback?.seenGrade ?? null,
            reviewerName: answer.team_member_id
              ? answer.teamMember?.User?.name
              : "מפקדי הקהדייה",
            axis: { name: axisName, color: axisColor },
            taskGroupName,
            answers: [
              {
                summary_grade: hasSpecialPermission
                  ? answer.summary_grade
                  : feedback.seenGrade && answer.is_viewable
                    ? answer.summary_grade
                    : null,
                feedbackAnswerIsViewable: answer.is_viewable,
              },
            ],
            categories: categoriesWithCounts,
            taskCompleted_at: taObj.completed_at,
            taskCompleted: taObj.completed,
          });
        });
      } else {
        const axisName = taObj.Task?.TaskGroup?.Axis?.name ?? null;
        const axisColor = taObj.Task?.TaskGroup?.Axis?.color ?? null;
        const taskGroupName = taObj.Task?.TaskGroup?.name ?? null;

        result.push({
          feedbackId: taskFeedback?.id ?? null,
          feedbackName: taskFeedback?.name ?? null,
          feedbackCreatedAt: taskFeedback?.createdAt ?? null,
          taskAssignmentId: taObj.id,
          formStartDate: taObj.start || null,
          taskName: taObj.Task.name,
          taskId: taObj.Task.id,
          taskAssignmentsStart: taObj.start,
          seenGrade: taskFeedback?.seenGrade ?? null,
          reviewerName: "?",
          axis: { name: axisName, color: axisColor },
          taskGroupName,
          answers: [],
          categories: [],
          hasPendingFeedback: true,
          taskCompleted_at: taObj.completed_at,
          taskCompleted: taObj.completed,
        });
      }
    });

    return res
      .status(200)
      .json({ success: true, count: result.length, data: result });
  } catch (err) {
    catchError(err, req, res, {
      function: "getFeedbacksByUserId",
      teamMemberId,
    });
  }
};

exports.getFeedbackStatus = async (req, res) => {
  const { taskAssignmentId } = req.params;

  try {
    const answer = await FeedbackAnswer.findOne({
      where: { task_assignment_id: taskAssignmentId },
      attributes: ["id", "is_viewable", "feedback_id"],
    });

    return res.json({
      success: true,
      data: {
        taskAssignmentId: Number(taskAssignmentId),
        feedbackId: answer?.feedback_id ?? null,
        filled: !!answer,
        isViewable: answer ? !!answer.is_viewable : false,
      },
    });
  } catch (error) {
    catchError(error, req, res, { function: "getFeedbackStatus" });
  }
};

exports.getFeedbacksQuestions = async (req, res) => {
  const courseId = req.params.courseId;
  const team = req.params.teamId;

  try {
    if (team === undefined || team === "undefined") {
      const feedbacks = await Feedback.findAll({
        where: {
          courseId: courseId,
        },
      });
      res.json({
        success: true,
        data: feedbacks,
      });
    } else {
      const feedbacks = await Feedback.findAll({
        where: {
          [Op.or]: [
            { [Op.and]: [{ courseId }, { team_id: null }] },
            { [Op.and]: [{ courseId }, { team_id: team }] },
          ],
        },
      });
      res.json({
        success: true,
        data: feedbacks,
      });
    }
  } catch (error) {
    catchError(error, req, res, {
      function: "getFeedbacksQuestions",
      courseId,
    });
  }
};

exports.getOpenFeedbackBySemester = async (req, res) => {
  try {
    let teamIds = req.query["teamId[]"];
    const courseBatchId = req.query.selectedCourseBatchId;

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

    // ✅ שליפת user_ids של משתמשים ששייכים לצוותים במחזור הספציפי
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

    const feedbacks = await Task.findAll({
      attributes: ["id"],
      where: {
        feedbackId: { [Op.ne]: null },
      },
      include: [
        {
          model: TaskAssignment,
          where: {
            team_id: { [Op.in]: numericIds },
            ...userIdCondition, // ✅ סינון לפי מחזור
          },
          attributes: ["id", "task_id", "team_id", "user_id"],
          include: [
            {
              model: FeedbackAnswer,
              as: "answers",
              attributes: ["task_assignment_id"],
            },
            {
              model: Team,
              attributes: ["name"],
            },
          ],
        },
      ],
      order: [["id", "ASC"]],
    }).then((tasks) => {
      const teamResults = {};

      tasks.forEach((task) => {
        task.TaskAssignments.forEach((assignment) => {
          const teamId = assignment.team_id;
          const teamName = assignment.Team ? assignment.Team.name : "ללא שם";

          if (!assignment.answers || assignment.answers.length === 0) {
            if (!teamResults[teamId]) {
              teamResults[teamId] = {
                name: teamName,
                count: 0,
                countedTasks: new Set(),
              };
            }

            if (!teamResults[teamId].countedTasks.has(task.id)) {
              teamResults[teamId].count++;
              teamResults[teamId].countedTasks.add(task.id);
            }
          }
        });
      });

      return Object.values(teamResults).map((team) => ({
        name: team.name,
        count: team.count,
      }));
    });

    res.json(feedbacks);
  } catch (error) {
    catchError(error, req, res, { function: "getOpenFeedbackBySemester" });
  }
};

exports.getOpenFeedbackByTeam = async (req, res) => {
  try {
    let teamId = req.query["teamId"];
    const courseBatchId = req.query.selectedCourseBatchId; // ✅ הוספה

    if (!teamId) {
      return res
        .status(400)
        .json({ error: 'Missing "teamId" query parameter' });
    }

    const numericTeamId = Number(teamId);

    // ✅ בניית תנאי לפי מחזור
    let userIdCondition = {};

    if (courseBatchId) {
      const teamMembers = await TeamMember.findAll({
        where: {
          team_id: numericTeamId,
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

    const feedbacks = await Task.findAll({
      attributes: ["id"],
      where: {
        feedbackId: { [Op.ne]: null },
      },
      include: [
        {
          model: TaskAssignment,
          where: {
            team_id: numericTeamId,
            ...userIdCondition, // ✅ סינון לפי מחזור
          },
          attributes: ["id", "task_id", "user_id"],
          include: [
            {
              model: FeedbackAnswer,
              as: "answers",
              attributes: ["task_assignment_id"],
            },
            {
              model: TeamMember,
              as: "TeamMember",
              attributes: ["id", "user_id"],
              include: [
                {
                  model: User,
                  attributes: ["name"],
                },
              ],
            },
          ],
        },
      ],
      order: [["id", "ASC"]],
    }).then((tasks) => {
      const userResults = {};

      tasks.forEach((task) => {
        task.TaskAssignments.forEach((assignment) => {
          const userName = assignment.TeamMember?.User?.name || "ללא שם";
          if (!assignment.answers || assignment.answers.length === 0) {
            if (!userResults[userName]) {
              userResults[userName] = { name: userName, value: 0 };
            }
            userResults[userName].value++;
          }
        });
      });

      return Object.values(userResults);
    });

    res.json(feedbacks);
  } catch (error) {
    catchError(error, req, res, { function: "getOpenFeedbackByTeam" });
  }
};

exports.toggleFeedbackActive = async (req, res) => {
  try {
    const { id } = req.params;

    const feedback = await Feedback.findByPk(id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "המשוב לא נמצא",
      });
    }

    // Toggle: true → false, false → true
    const newStatus = !feedback.is_active;

    const updatedFeedback = await feedback.update(
      { is_active: newStatus },
      { returning: true }
    );

    logger.info("Feedback active status toggled", {
      feedbackId: id,
      previousStatus: feedback.is_active,
      newStatus,
      userId: req.headers["x-user-id"],
    });

    return res.status(200).json({
      success: true,
      message: newStatus ? "המשוב הופעל" : "המשוב הושבת",
      data: {
        id: updatedFeedback.id,
        is_active: updatedFeedback.is_active,
      },
    });
  } catch (error) {
    catchError(error, req, res, {
      function: "toggleFeedbackActive",
      feedbackId: req.params.id,
    });
  }
};
