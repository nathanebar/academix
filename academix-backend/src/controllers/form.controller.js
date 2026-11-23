const {
  Form,
  FormSubmission,
  FormSubmissionAnswer,
  Task,
  FormQuestion,
  FormOption,
  TaskAssignment,
  sequelize,
  TeamMember,
  Team,
  File,
  TeamCourseBatch,
} = require("../../models");
const { config } = require("dotenv");
const { S3Client, HeadObjectCommand } = require("@aws-sdk/client-s3");

const {
  GetObjectCommand: GetObject,
  PutObjectCommand: UploadObject,
  CreateBucketCommand: CreateBucket,
  DeleteObjectCommand: DeleteObject,
} = require("@aws-sdk/client-s3");

const { Op } = require("sequelize");
const {
  getFormByTaskAssignmentId,
  getUsersInTeamAndTask,
  getByFormId,
} = require("../services/form.service");
const logger = require("../utils/logger");
const { catchError } = require("../utils/errorHandler");
const { assignToTeam } = require("./taskAssignment.controller");

config({ quiet: true });

const endpoint = process.env.S3_ENDPOINT;
const accessKey = process.env.S3_ACCESS_KEY;
const secretKey = process.env.S3_SECRET_KEY;
const region = "us-east-1";

const credentials = {
  accessKeyId: accessKey,
  secretAccessKey: secretKey,
};

const s3Client = new S3Client({
  endpoint,
  credentials,
  region,
  forcePathStyle: true,
});

(exports.getAllByCourseIdAndTeamId = async (req, res) => {
  const courseId = req.params.courseId;
  const teamId = req.query.teamId;
  const selectedCourseBatch = req.query.courseBatch;
  const formType = req.query.type;

  const isValidType = !formType || ["test", "survey"].includes(formType);

  try {
    const isValidCourseId = courseId && !isNaN(courseId) && courseId !== 0;
    const isValidTeamId = teamId && !isNaN(teamId) && teamId !== 0;
    const isValidCourseBatchId =
      selectedCourseBatch &&
      !isNaN(selectedCourseBatch) &&
      selectedCourseBatch !== 0;

    if (!isValidCourseId) {
      return res.status(400).json({
        success: false,
        message: "Invalid courseId provided",
      });
    }
    if (!isValidCourseBatchId) {
      return res.status(400).json({
        success: false,
        message: "Invalid selectedCourseBatch provided",
      });
    }
    if (!isValidType) {
      return res.status(400).json({
        success: false,
        message: "Invalid type. Must be 'test' or 'survey'",
      });
    }

    let relevantUserIds = null;

    if (selectedCourseBatch && teamId) {
      const teamMembers = await TeamMember.findAll({
        where: {
          team_id: teamId,
          course_batch_id: selectedCourseBatch,
        },
        attributes: ["id"],
      });
      relevantUserIds = teamMembers.map((m) => m.id);
    }

    const whereCondition = {};

    // Add courseId condition
    if (isValidCourseId) {
      whereCondition.courseId = courseId;
    }

    if (formType) {
      whereCondition.type = formType;
    }
    // Handle teamId - return records where team_id equals teamId OR team_id is NULL
    if (isValidTeamId) {
      whereCondition[Op.or] = [{ teamId: teamId }, { teamId: null }];
    } else {
      // If no teamId provided, still get records where teamId is NULL

      whereCondition.courseId = courseId;
    }

    const forms = await Form.findAll({
      attributes: [
        "id",
        "title",
        "description",
        "createdAt",
        "is_active",
        "type",
        "teamId",
      ],
      include: [
        {
          model: FormSubmission,
          as: "FormSubmissions",
          attributes: ["score", "task_assignment_id"],
        },
        {
          model: Task,
          as: "tasks",
          attributes: ["id", "name"],
          include: {
            model: TaskAssignment,
            as: "taskAssignments",
            attributes: ["id", "team_id", "user_id", "createdAt", "start"],
            include: [
              {
                model: Team,
                attributes: ["name"],
              },
              {
                model: TeamMember,
                as: "TeamMember",
                attributes: ["id", "user_id"],
                include: [
                  {
                    model: sequelize.models.User,
                    attributes: ["name", "militaryid"],
                  },
                ],
              },
            ],

            where: relevantUserIds ? { user_id: relevantUserIds } : {},
            required: relevantUserIds ? true : false,
          },
        },
      ],
      where: whereCondition,
    });

    const result = forms.flatMap((form) => {
      // Get all submissions for this form
      const formSubmissions = form.FormSubmissions ?? [];

      if (!form.tasks || form.tasks.length === 0) {
        return [
          {
            id: form.id,
            type: form.type,
            created_at: form.createdAt,
            title: form.title,
            description: form.description,
            is_active: form.is_active,
            task_id: null,
            taskName: null,
            assignmentAt: null,
            user_ids: [],
            team_ids: [],
            scores: [],
            scores_average: null,
            formTeamId: form.teamId,
          },
        ];
      }

      return form.tasks.map((task) => {
        // Get all assignments for this task
        const taskAssignments = task.taskAssignments ?? [];

        // Get all assignment IDs for this task
        const taskAssignmentIds = taskAssignments.map((a) => a.id);

        // Filter submissions that match THIS task's assignments
        const taskSubmissions = formSubmissions.filter(
          (sub) =>
            sub.task_assignment_id != null &&
            taskAssignmentIds.includes(sub.task_assignment_id)
        );

        // Calculate scores for this task
        const taskRawScores = taskSubmissions.map((sub) =>
          sub.score === null ? null : Number(sub.score)
        );
        const taskNonNullScores = taskRawScores.filter((s) => s !== null);
        const taskScoresAverage =
          taskNonNullScores.length > 0
            ? taskNonNullScores.reduce((a, b) => a + b, 0) /
              taskNonNullScores.length
            : null;

        // Build team map (group users by team)
        const teamMap = new Map();
        let earliestAssignment = null;

        taskAssignments.forEach((assignment) => {
          // Track earliest assignment
          if (
            !earliestAssignment ||
            assignment.createdAt < earliestAssignment
          ) {
            earliestAssignment = assignment.createdAt;
          }

          const teamId = assignment.team_id;
          const userId = assignment.user_id;

          if (teamId != null) {
            if (!teamMap.has(teamId)) {
              teamMap.set(teamId, {
                teamId: teamId,
                teamName: assignment.Team?.name ?? null,
                userIds: new Set(),
              });
            }
            if (userId != null) {
              teamMap.get(teamId).userIds.add(userId);
            }
          }
        });

        // Convert to array
        const team_ids = Array.from(teamMap.values()).map((team) => ({
          teamId: team.teamId,
          teamName: team.teamName,
          userCount: team.userIds.size,
        }));

        // Collect all user IDs
        const user_ids = Array.from(
          new Set(taskAssignments.map((a) => a.user_id).filter(Boolean))
        );

        const traineeNames = taskAssignments
          .map((assign) => assign.TeamMember?.User?.name)
          .filter(Boolean);

        const traineeDetails = taskAssignments
          .map((assign) => ({
            name: assign.TeamMember?.User?.name,
            militaryId: assign.TeamMember?.User?.militaryid,
            userId: assign.TeamMember?.id,
          }))
          .filter(Boolean);

        return {
          id: form.id,
          type: form.type,
          created_at: form.createdAt,
          title: form.title,
          description: form.description,
          is_active: form.is_active,
          task_id: task.id,
          taskName: task.name,
          assignmentAt: earliestAssignment,
          user_ids,
          team_ids,
          scores: taskRawScores.filter((s) => s !== null),
          scores_average: taskScoresAverage,
          traineeNames,
          traineeDetails,
          formTeamId: form.teamId,
        };
      });
    });

    res.json(result);
  } catch (err) {
    catchError(err, req, res, {
      function: "getAllByCourseIdAndTeamId",
      courseId,
      teamId,
    });
  }
}),
  (exports.getAll = async (req, res) => {
    try {
      const forms = await Form.findAll({});

      const taskAssignments = await TaskAssignment.findAll({
        include: [
          {
            model: Task,
            attributes: ["id", "formId"],
            include: [
              {
                model: Form,
                attributes: ["id", "title", "description", "createdAt"],
              },
            ],
          },
          {
            model: FormSubmission,
            as: "formSubmissions",
            attributes: ["score"],
          },
        ],
      });

      const formUsersMap = new Map();

      taskAssignments.forEach((item) => {
        const formId = item.Task.Form.id;
        if (!formUsersMap.has(formId)) {
          formUsersMap.set(formId, {
            form: item.Task.Form,
            user_ids: new Set(),
            team: item.team_id,
            created_at: item.createdAt,
            form_submissions: [],
          });
        }
        // Add user ID to the set (automatically handles duplicates)
        formUsersMap.get(formId).user_ids.add(item.user_id);
        if (item.formSubmissions[0]) {
          formUsersMap
            .get(formId)
            .form_submissions.push(Number(item.formSubmissions[0].score));
        } else {
          formUsersMap.get(formId).form_submissions.push(Number("0"));
        }
      });

      const result = forms.map((form) => {
        const assignedData = formUsersMap.get(form.id);

        // Calculate average score
        let average_score = null;
        let user_ids = [];
        let created_at = form.createdAt; // Use form's created_at

        if (assignedData) {
          average_score =
            assignedData.form_submissions.length > 0
              ? assignedData.form_submissions.reduce(
                  (sum, submission) => sum + (parseFloat(submission) || 0),
                  0
                ) / assignedData.form_submissions.length
              : null;
          user_ids = Array.from(assignedData.user_ids);
          created_at = assignedData.created_at;
          team = assignedData.team; // Use the assignment's created_at if exists
        }

        return {
          formId: form.id,
          title: form.title,
          teamId: team,
          user_ids: user_ids.length,
          created_at: created_at,
          average_score: average_score,
        };
      });

      res.json(result);
    } catch (err) {
      catchError(err, req, res, { function: "getAll" });
    }
  }),
  (exports.getFormsByUser = async (req, res) => {
    try {
      const { userId, type } = req.query;
      const params = req.params.userId ? req.params.userId.split(",") : [];
      const teamId = params[0];
      const assignedUserId = params[1] || userId || params[2];
      const permission = req.headers.selectedpermission;

      if (!assignedUserId || isNaN(assignedUserId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID provided",
        });
      }

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

      const userCourseBatchId = params[2];

      let blockDates = null;
      if (!hasSpecialPermission) {
        blockDates = await TeamCourseBatch.findOne({
          where: {
            team_id: teamId,
            course_batch_id: userCourseBatchId,
          },
          attributes: ["blockFromDate", "blockToDate"],
        });
      }

      const formAssociation = type === "survey" ? "survey" : "parentForm";

      const formsWithSubmissions = await TaskAssignment.findAll({
        include: [
          {
            model: Task,
            attributes: [
              "id",
              "formId",
              "surveyId",
              "name",
              "createdAt",
              "status",
            ],
            where:
              type === "survey"
                ? { surveyId: { [Op.ne]: null } }
                : { formId: { [Op.ne]: null } },
            include: [
              {
                model: Form,
                as: formAssociation,
                attributes: ["id", "title", "description"],
                include: [
                  {
                    model: FormQuestion,
                    as: "FormQuestions",
                    attributes: ["points"],
                  },
                ],
              },
            ],
          },
          {
            model: FormSubmission,
            as: "formSubmissions",
            attributes: ["score", "started_at", "submitted_at", "id"],
            required: false,
            order: [["createdAt", "DESC"]],
            limit: 1,
          },
          {
            model: TeamMember,
            as: "TeamMember",
            where: {
              id: assignedUserId,
              team_id: teamId,
            },
          },
        ],
      });

      const result = formsWithSubmissions
        .filter((taskAssignment) => {
          const formData = taskAssignment.Task?.[formAssociation];
          if (!formData) return false;

          // Only check block dates for students with "operational" status
          if (!hasSpecialPermission) {
            const hasBlockDates =
              blockDates?.blockFromDate && blockDates?.blockToDate;
            const taskStart = taskAssignment.start;
            const taskStatus = taskAssignment.Task?.status;

            // Only filter by dates if status is NOT "assignment_bank"
            if (hasBlockDates && taskStatus !== "assignment_bank") {
              if (
                taskStart &&
                taskStart >= blockDates.blockFromDate &&
                taskStart <= blockDates.blockToDate
              ) {
                return false;
              }
            }
          }
          return true;
        })
        .map((taskAssignment) => {
          // Get the latest submission
          const latestSubmission = taskAssignment.formSubmissions?.[0];
          const form = taskAssignment.Task?.[formAssociation];
          const taskName = taskAssignment.Task?.name;

          // Calculate total points
          const maxscore =
            form?.FormQuestions?.reduce(
              (sum, question) => sum + (question.points || 0),
              0
            ) || 0;

          // Calculate score percentage
          const scorePercentage =
            latestSubmission?.score && maxscore > 0
              ? Number(((latestSubmission.score / maxscore) * 100).toFixed(2))
              : null;

          return {
            formId: form?.id,
            formType: type || "form",
            taskName: taskName,
            formTitle: form?.title,
            formDesc: form?.description,
            formStartDate: taskAssignment.Task?.createdAt,
            score: latestSubmission?.score || null,
            maxscore: maxscore,
            scorePercentage: scorePercentage,
            started_at: latestSubmission?.started_at || null,
            completed_at: latestSubmission?.submitted_at || null,
            submissionStatus: latestSubmission?.status || null,
            taskassignmentid: taskAssignment.id,
            assignAt: taskAssignment.start,
            taskId: taskAssignment.Task?.id,
          };
        });

      return res.status(200).json({
        success: true,
        message: `${
          type === "survey" ? "Surveys" : "Forms"
        } retrieved successfully`,
        data: result,
      });
    } catch (err) {
      catchError(err, req, res, { function: "getFormsByUser" });
    }
  });

exports.getByTaskAssignmentId = async (req, res) => {
  const { taskassignmentid, request_for, issurvey } = req.headers;
  try {
    const form = await getFormByTaskAssignmentId(
      parseInt(taskassignmentid),
      request_for,
      issurvey
    );

    if (request_for === "show") {
      res.status(200).json(form);
    } else if (form?.error && request_for === "answer") {
      res.status(200).json(form);
    } else {
      res.status(200).json(form);
    }
  } catch (error) {
    catchError(error, req, res, {
      function: "getByTaskAssignmentId",
      taskassignmentid,
    });
  }
};

exports.getByFormId = async (req, res) => {
  const {
    //  userId,
  } = req.headers;
  const formId = req.params.formId;
  if (!formId || isNaN(formId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid formId provided",
    });
  }
  try {
    const form = await getByFormId(formId);
    if (form?.error) {
      res.status(400).json(form);
    } else res.status(200).json(form);
  } catch (error) {
    catchError(error, req, res, { function: "getByFormId", formId });
  }
};

exports.getUsersInSameTeamAndTask = async (req, res) => {
  const {
    //  userId,
    taskid,
    teamid,
    selectedcoursebatch,
  } = req.headers;

  try {
    const users = await getUsersInTeamAndTask(
      taskid,
      teamid,
      selectedcoursebatch
    );
    if (users?.error) {
      res.status(400).json(users);
    } else res.status(200).json(users);
  } catch (err) {
    catchError(err, req, res, {
      function: "getUsersInSameTeamAndTask",
      taskid,
      teamid,
    });
  }
};

exports.getAllForms = async (req, res) => {
  try {
    const forms = await Form.findAll({});

    res.status(200).json(forms);
  } catch (err) {
    catchError(err, req, res, { function: "getAllForms" });
  }
};

exports.createForm = async (req, res) => {
  const transaction = await sequelize.transaction();
  const data = req.body;

  // ---------- helper : crée une option en ignorant les vides (option_text NOT NULL) ----------
  const createOption = async (
    questionId,
    text,
    {
      side = "none",
      orderIndex,
      paireKey = null,
      isCorrect = null,
      points = null,
    } = {}
  ) => {
    const clean = (text ?? "").trim();
    // if (!clean) return null; // évite le notNull Violation
    return FormOption.create(
      {
        question_id: questionId,
        option_text: clean,
        side,
        orderIndex,
        paireKey,
        is_correct: isCorrect,
        points,
      },
      { transaction }
    );
  };

  // ---------- helper : persist toutes les options d'une question ----------
  const persistQuestion = async (question, newQuestionId) => {
    switch (question.type) {
      case "american":
      case "ordering_line": {
        for (let i = 0; i < (question.options || []).length; i++) {
          await createOption(newQuestionId, question.options[i], {
            orderIndex: i,
          });
        }
        break;
      }

      case "scale": {
        await createOption(newQuestionId, question.min?.title, {
          orderIndex: question.min?.value ?? 0,
        });
        await createOption(newQuestionId, question.max?.title, {
          orderIndex: question.max?.value ?? 20,
        });
        break;
      }

      case "multipleQuestion": {
        // sous-questions → side="right"
        for (let i = 0; i < (question.matches || []).length; i++) {
          await createOption(newQuestionId, question.matches[i]?.value1, {
            side: "right",
            orderIndex: i,
          });
        }
        // pool partagé → side="left"
        for (let j = 0; j < (question.options || []).length; j++) {
          await createOption(newQuestionId, question.options[j], {
            side: "left",
            orderIndex: j,
          });
        }
        break;
      }

      case "matching_pairs": {
        // paires mot ↔ pair, groupées par paireKey
        for (let i = 0; i < (question.matches || []).length; i++) {
          const pairKey = `pair_${i}`;
          await createOption(newQuestionId, question.matches[i]?.value1, {
            side: "right",
            orderIndex: i,
            paireKey: pairKey,
          });
          await createOption(newQuestionId, question.matches[i]?.value2, {
            side: "left",
            orderIndex: i,
            paireKey: pairKey,
          });
        }
        break;
      }

      case "fill_in_bank": {
        // banque de mots proposés → side="none"
        for (let i = 0; i < (question.matches || []).length; i++) {
          await createOption(newQuestionId, question.matches[i]?.value1, {
            orderIndex: i,
          });
        }
        break;
      }

      case "true_false": {
        await createOption(newQuestionId, "", {
          isCorrect: question.booleanValue ?? null,
        });
        break;
      }

      // text, fill_in_open, description : rien à stocker en options
      default:
        break;
    }
  };

  try {
    const newForm = await Form.create(data.form, { transaction });

    try {
      for (let qi = 0; qi < data.questions.length; qi++) {
        const question = data.questions[qi];

        const newQuestion = await FormQuestion.create(
          {
            form_id: newForm.id,
            question_text: question.text,
            question_type: question.type,
            is_required: question.required,
            points: question.points,
            orderIndex: qi, // ✅ IMPORTANT : l'ordre du tableau front
          },
          { transaction }
        );

        await persistQuestion(question, newQuestion.id);

        // ---------- fichiers (file_upload) ----------
        if (
          question.type === "file_upload" &&
          question.uploadedFiles?.length > 0
        ) {
          for (const fileData of question.uploadedFiles) {
            try {
              if (fileData.base64 || fileData.buffer) {
                const s3Key = `upload_${Date.now()}_${fileData.name}`;
                await s3Client.send(
                  new UploadObject({
                    Bucket: fileData.bucket || "academix",
                    Key: s3Key,
                    Body: Buffer.from(fileData.base64, "base64"),
                    ContentType: fileData.type,
                  })
                );
                await File.create(
                  {
                    form_question_id: newQuestion.id,
                    task_id: null,
                    s3BucketName: fileData.bucket || "academix",
                    s3Key,
                    name: fileData.name,
                    size: fileData.size,
                    type: fileData.type,
                    isPatbass: false,
                    isFileResponse: false,
                  },
                  { transaction }
                );
              } else if (fileData.key) {
                await File.create(
                  {
                    form_question_id: newQuestion.id,
                    task_id: null,
                    s3BucketName: fileData.bucket || "academix",
                    s3Key: fileData.key,
                    name: fileData.name,
                    size: fileData.size,
                    type: fileData.type,
                    isPatbass: false,
                    isFileResponse: false,
                  },
                  { transaction }
                );
              }
            } catch (error) {
              catchError(error, req, res, {
                function: "createForm - file upload",
                questionId: newQuestion.id,
              });
            }
          }
        }
      }

      await transaction.commit();
      logger.info("Form created", {
        formId: newForm.id,
        title: data.form.title,
        courseId: data.form.courseId,
        userId: req.headers["x-user-id"],
      });
      return res.status(200).json(newForm);
    } catch (error) {
      await transaction.rollback();
      return catchError(error, req, res, { function: "form.createForm" });
    }
  } catch (error) {
    await transaction.rollback();
    catchError(error, req, res, { function: "createForm" });
  }
};

exports.updateForm = async (req, res) => {
  const transaction = await sequelize.transaction();
  const { formId } = req.params;
  const data = req.body;

  const createOption = async (
    questionId,
    text,
    {
      side = "none",
      orderIndex,
      paireKey = null,
      isCorrect = null,
      points = null,
    } = {}
  ) => {
    const clean = (text ?? "").trim();
    // if (!clean) return null;
    return FormOption.create(
      {
        question_id: questionId,
        option_text: clean,
        side,
        orderIndex,
        paireKey,
        is_correct: isCorrect,
        points,
      },
      { transaction }
    );
  };

  const persistQuestion = async (question, newQuestionId) => {
    switch (question.type) {
      case "american":
      case "ordering_line":
        for (let i = 0; i < (question.options || []).length; i++) {
          await createOption(newQuestionId, question.options[i], {
            orderIndex: i,
          });
        }
        break;
      case "scale":
        await createOption(newQuestionId, question.min?.title, {
          orderIndex: question.min?.value ?? 0,
        });
        await createOption(newQuestionId, question.max?.title, {
          orderIndex: question.max?.value ?? 20,
        });
        break;
      case "multipleQuestion":
        for (let i = 0; i < (question.matches || []).length; i++) {
          await createOption(newQuestionId, question.matches[i]?.value1, {
            side: "right",
            orderIndex: i,
          });
        }
        for (let j = 0; j < (question.options || []).length; j++) {
          await createOption(newQuestionId, question.options[j], {
            side: "left",
            orderIndex: j,
          });
        }
        break;
      case "matching_pairs":
        for (let i = 0; i < (question.matches || []).length; i++) {
          const pairKey = `pair_${i}`;
          await createOption(newQuestionId, question.matches[i]?.value1, {
            side: "right",
            orderIndex: i,
            paireKey: pairKey,
          });
          await createOption(newQuestionId, question.matches[i]?.value2, {
            side: "left",
            orderIndex: i,
            paireKey: pairKey,
          });
        }
        break;
      case "fill_in_bank":
        for (let i = 0; i < (question.matches || []).length; i++) {
          await createOption(newQuestionId, question.matches[i]?.value1, {
            orderIndex: i,
          });
        }
        break;
      case "true_false":
        await createOption(newQuestionId, "", {
          isCorrect: question.booleanValue ?? null,
        });
        break;
      default:
        break;
    }
  };

  try {
    const form = await Form.findByPk(formId, { transaction });
    if (!form) {
      await transaction.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Form not found" });
    }

    await form.update(
      {
        title: data.form?.title ?? form.title,
        description: data.form?.description ?? form.description,
        type: data.form?.type ?? form.type,
        is_active: data.form?.is_active ?? form.is_active,
        show_score_per_question:
          data.form?.show_score_per_question ?? form.show_score_per_question,
      },
      { transaction }
    );

    // ---------- questions : suppression des anciennes + recréation ----------
    const existingQuestions = await FormQuestion.findAll({
      where: { form_id: formId },
      transaction,
    });
    for (const q of existingQuestions) {
      await FormOption.destroy({ where: { question_id: q.id }, transaction });
    }
    await FormQuestion.destroy({ where: { form_id: formId }, transaction });

    for (let qi = 0; qi < data.questions.length; qi++) {
      const question = data.questions[qi];
      const newQuestion = await FormQuestion.create(
        {
          form_id: formId,
          question_text: question.text,
          question_type: question.type,
          is_required: question.required,
          points: question.points,
          orderIndex: qi, 
        },
        { transaction }
      );

      await persistQuestion(question, newQuestion.id);

      // ---------- fichiers (re-téléversement / réattache) ----------
      if (
        question.type === "file_upload" &&
        question.uploadedFiles?.length > 0
      ) {
        for (const fileData of question.uploadedFiles) {
          try {
            if (fileData.base64 || fileData.buffer) {
              const s3Key = `upload_${Date.now()}_${fileData.name}`;
              await s3Client.send(
                new UploadObject({
                  Bucket: fileData.bucket || "academix",
                  Key: s3Key,
                  Body: Buffer.from(fileData.base64, "base64"),
                  ContentType: fileData.type,
                })
              );
              await File.create(
                {
                  form_question_id: newQuestion.id,
                  task_id: null,
                  s3BucketName: fileData.bucket || "academix",
                  s3Key,
                  name: fileData.name,
                  size: fileData.size,
                  type: fileData.type,
                  isPatbass: false,
                  isFileResponse: false,
                },
                { transaction }
              );
            } else if (fileData.key) {
              await File.create(
                {
                  form_question_id: newQuestion.id,
                  task_id: null,
                  s3BucketName: fileData.bucket || "academix",
                  s3Key: fileData.key,
                  name: fileData.name,
                  size: fileData.size,
                  type: fileData.type,
                  isPatbass: false,
                  isFileResponse: false,
                },
                { transaction }
              );
            }
          } catch (error) {
            catchError(error, req, res, {
              function: "updateForm - file upload",
              questionId: newQuestion.id,
            });
          }
        }
      }
    }

    await transaction.commit();
    return res.status(200).json(form);
  } catch (error) {
    await transaction.rollback();
    catchError(error, req, res, { function: "updateForm" });
  }
};

exports.toggleFormActive = async (req, res) => {
  try {
    const { id } = req.params;

    const form = await Form.findByPk(id);

    if (!form) {
      return res.status(404).json({
        success: false,
        message: "הטופס לא נמצא",
      });
    }

    // Toggle: true → false, false → true
    const newStatus = !form.is_active;

    const updatedForm = await form.update(
      { is_active: newStatus },
      { returning: true }
    );

    logger.info("Form active status toggled", {
      formId: id,
      previousStatus: form.is_active,
      newStatus,
      userId: req.headers["x-user-id"],
    });

    return res.status(200).json({
      success: true,
      message: newStatus ? "הטופס הופעל" : "הטופס הושבת",
      data: {
        id: updatedForm.id,
        is_active: updatedForm.is_active,
      },
    });
  } catch (error) {
    catchError(error, req, res, {
      function: "toggleFormActive",
      formId: req.params.id,
    });
  }
};

exports.getSurveyDashboard = async (req, res) => {
  const { courseId } = req.params;
  const { teamId, courseBatch, formId } = req.query;

  try {
    const isValidCourseId = courseId && !isNaN(courseId) && courseId !== 0;
    if (!isValidCourseId) {
      return res.status(400).json({
        success: false,
        message: "Invalid courseId provided",
      });
    }

    let relevantUserIds = null;
    if (
      teamId &&
      courseBatch &&
      teamId !== "undefined" &&
      courseBatch !== "undefined"
    ) {
      const teamMembers = await TeamMember.findAll({
        where: {
          team_id: teamId,
          course_batch_id: courseBatch,
        },
        attributes: ["id"],
      });
      relevantUserIds = teamMembers.map((m) => m.id);
    }

    const whereCondition = {
      courseId: courseId,
      type: "survey",
    };

    if (teamId && teamId !== "undefined") {
      whereCondition[Op.or] = [{ teamId: teamId }, { teamId: null }];
    }

    if (formId) {
      whereCondition.id = formId;
    }

    const surveys = await Form.findAll({
      where: whereCondition,
      attributes: [
        "id",
        "title",
        "description",
        "createdAt",
        "is_active",
        "type",
        "teamId",
      ],
      include: [
        {
          model: FormQuestion,
          as: "FormQuestions",
          attributes: ["id", "question_text", "question_type", "points"],
          include: [
            {
              model: FormOption,
              as: "FormOptions",
              attributes: ["id", "option_text", "is_correct", "orderIndex"],
            },
          ],
        },
        {
          model: Task,
          as: "surveyTasks",
          attributes: ["id", "name", "is_active"],
          include: [
            {
              model: TaskAssignment,
              as: "taskAssignments",
              attributes: ["id", "user_id", "team_id", "createdAt", "start"],
              where: relevantUserIds ? { user_id: relevantUserIds } : {},
              required: relevantUserIds ? true : false,
              include: [
                {
                  model: Team,
                  attributes: ["name"],
                },
                {
                  model: TeamMember,
                  as: "TeamMember",
                  attributes: ["id", "user_id"],
                  include: [
                    {
                      model: sequelize.models.User,
                      attributes: ["name", "militaryid", "username"],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          model: FormSubmission,
          as: "FormSubmissions",
          attributes: [
            "id",
            "started_at",
            "submitted_at",
            "score",
            "is_published",
            "createdAt",
            "task_assignment_id",
          ],
          include: [
            {
              model: FormSubmissionAnswer,
              as: "FormSubmissionAnswers",
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    const questionData = surveys.map((survey) => {
      // Create a map of FormOptions by id for quick lookup
      const formOptionsMap = {};
      const formQuestionsMap = {};

      survey.FormQuestions.forEach((question) => {
        formQuestionsMap[question.id] = question;
        question.FormOptions.forEach((option) => {
          formOptionsMap[option.id] = option;
        });
      });

      // Map submissions by task_assignment_id
      const submissionsByTaskId = {};
      survey.FormSubmissions.forEach((submission) => {
        if (!submissionsByTaskId[submission.task_assignment_id]) {
          submissionsByTaskId[submission.task_assignment_id] = [];
        }
        submissionsByTaskId[submission.task_assignment_id].push(submission);
      });

      // Build team member data with all questions and answers
      return survey.surveyTasks.flatMap((task) =>
        task.taskAssignments.map((assignment) => {
          // Get user data
          const user = assignment.TeamMember?.User || {};

          // Get submissions for this assignment
          const submissions = submissionsByTaskId[assignment.id] || [];

          // Build answers for all questions (in order)
          const allAnswers = survey.FormQuestions.map((question) => {
            // Find all answers for this question from all submissions
            const questionAnswers = submissions.flatMap((sub) =>
              (sub.FormSubmissionAnswers || []).filter(
                (ans) => ans.form_question_id === question.id
              )
            );

            // Process answers based on question type
            const processedAnswers = questionAnswers.map((answer) => {
              let answerData = {
                answerId: answer.id,
                value_text: answer.value_text,
                value_number: answer.value_number,
              };

              // Handle option-based answers
              if (
                answer.selected_option_id &&
                formOptionsMap[answer.selected_option_id]
              ) {
                answerData.selected_option =
                  formOptionsMap[answer.selected_option_id];
              }
              if (
                answer.left_option_id &&
                formOptionsMap[answer.left_option_id]
              ) {
                answerData.left_option = formOptionsMap[answer.left_option_id];
              }
              if (
                answer.right_option_id &&
                formOptionsMap[answer.right_option_id]
              ) {
                answerData.right_option =
                  formOptionsMap[answer.right_option_id];
              }

              return answerData;
            });

            return {
              surevyId: survey.id,
              questionId: question.id,
              question_text: question.question_text,
              question_type: question.question_type,
              points: question.points,
              answers: processedAnswers,
            };
          });

          return {
            surevyId: survey.id,
            task_assignment_id: assignment.id,
            username: user.username,
            name: user.name,
            militaryid: user.militaryid,
            team_name: assignment.Team?.name,
            team_id: assignment.team_id,
            user_id: assignment.user_id,
            questions: allAnswers,
          };
        })
      );
    });

    const dashboardData = surveys.map((survey) => {
      const tasks = survey.surveyTasks || [];
      const questions = survey.FormQuestions || [];
      const taskAssignnments = survey.Task | [];

      const filteredAssignmentIds = tasks.flatMap((task) =>
        (task.taskAssignments || []).map((a) => a.id)
      );

      // חישוב משימות
      const totalAssignments = tasks.reduce(
        (sum, task) => sum + (task.taskAssignments?.length || 0),
        0
      );
      const activeAssignments = tasks.reduce(
        (sum, task) =>
          task.is_active ? sum + (task.taskAssignments?.length || 0) : sum,
        0
      );

      const submissions = (survey.FormSubmissions || []).filter((sub) =>
        filteredAssignmentIds.includes(sub.task_assignment_id)
      );

      const totalSubmissions = submissions.length;
      const completedSubmissions = submissions.filter(
        (s) => s.submitted_at !== null
      ).length;
      const startedButNotCompleted = submissions.filter(
        (s) => s.started_at !== null && s.submitted_at === null
      ).length;

      const responseRate =
        totalAssignments > 0
          ? Math.round((totalSubmissions / totalAssignments) * 100)
          : 0;
      const completionRate =
        totalSubmissions > 0
          ? Math.round((completedSubmissions / totalSubmissions) * 100)
          : 0;

      const scores = submissions
        .filter((s) => s.score !== null)
        .map((s) => s.score);
      const averageScore =
        scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : null;
      const maxScore = scores.length > 0 ? Math.max(...scores) : null;
      const minScore = scores.length > 0 ? Math.min(...scores) : null;

      const questionsByType = questions.reduce((acc, q) => {
        acc[q.question_type] = (acc[q.question_type] || 0) + 1;
        return acc;
      }, {});

      const totalPoints = questions.reduce(
        (sum, q) => sum + (q.points || 0),
        0
      );

      const recentSubmissions = submissions
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

      const tasksWithStatus = tasks.map((task) => {
        const taskAssignments = task.taskAssignments || [];
        const responsesCount = submissions.filter((sub) => {
          return taskAssignments.some(
            (assign) => assign.id === sub.task_assignment_id
          );
        }).length;
        const hasSubmissions = responsesCount > 0;
        const traineeNames = taskAssignments
          .map((assign) => assign.TeamMember?.User?.name)
          .filter(Boolean);

        const submissionTaskAssignmentIds = submissions.map(
          (sub) => sub.task_assignment_id
        );

        const traineeDetails = taskAssignments
          .map((assign) => {
            const hasResponded = submissionTaskAssignmentIds.includes(
              assign.id
            );
            return {
              name: assign.TeamMember?.User?.name,
              militaryId: assign.TeamMember?.User?.militaryid,
              userId: assign.TeamMember?.User?.id,
              taskAssignmentId: assign.id,
              hasResponded: hasResponded,
            };
          })
          .filter(Boolean);

        return {
          id: task.id,
          name: task.name,
          is_active: task.is_active,
          assignmentsCount: taskAssignments.length,
          hasSubmissions,
          responsesCount,
          traineeDetails,
          questions: questions,
          questionData: questionData,
        };
      });

      const assignmentIds = tasks.flatMap((task) =>
        (task.taskAssignments || []).map((a) => a.id)
      );
      const submittedUserIds = submissions
        .filter((sub) => assignmentIds.includes(sub.task_assignment_id))
        .map((sub) => {
          const task = tasks.find((t) =>
            t.taskAssignments?.some((a) => a.id === sub.task_assignment_id)
          );
          const assignment = task?.taskAssignments?.find(
            (a) => a.id === sub.task_assignment_id
          );
          return assignment?.user_id;
        })
        .filter(Boolean);

      const uniqueRespondents = [...new Set(submittedUserIds)].length;

      return {
        id: survey.id,
        title: survey.title,
        description: survey.description,
        is_active: survey.is_active,
        createdAt: survey.createdAt,

        tasks: {
          total: tasks.length,
          active: tasks.filter((t) => t.is_active).length,
          totalAssignments,
          activeAssignments,
        },

        responses: {
          totalSubmissions,
          completedSubmissions,
          startedButNotCompleted,
          uniqueRespondents,
          responseRate,
          completionRate,
        },

        scores: {
          average: averageScore,
          max: maxScore,
          min: minScore,
          totalPoints,
        },

        questions: {
          total: questions.length,
          byType: questionsByType,
        },

        tasksList: tasksWithStatus,

        recentSubmissions: recentSubmissions.map((sub) => {
          const task = tasks.find((t) =>
            t.taskAssignments?.some((a) => a.id === sub.task_assignment_id)
          );
          const assignment = task?.taskAssignments?.find(
            (a) => a.id === sub.task_assignment_id
          );
          return {
            id: sub.id,
            score: sub.score,
            submittedAt: sub.submitted_at,
            startedAt: sub.started_at,
            taskName: task?.name || null,
            teamName: assignment?.Team?.name || null,
            isPublished: sub.is_published,
          };
        }),
        surveyTeamId: survey.teamId,
      };
    });

    const summary = {
      totalSurveys: surveys.length,
      activeSurveys: surveys.filter((s) => s.is_active).length,
      totalResponses: dashboardData.reduce(
        (sum, d) => sum + d.responses.totalSubmissions,
        0
      ),
      totalAssignments: dashboardData.reduce(
        (sum, d) => sum + d.tasks.totalAssignments,
        0
      ),
      overallResponseRate:
        dashboardData.reduce((sum, d) => sum + d.tasks.totalAssignments, 0) > 0
          ? Math.round(
              (dashboardData.reduce(
                (sum, d) => sum + d.responses.totalSubmissions,
                0
              ) /
                dashboardData.reduce(
                  (sum, d) => sum + d.tasks.totalAssignments,
                  0
                )) *
                100
            )
          : 0,
    };

    res.json({
      success: true,
      summary,
      surveys: dashboardData,
    });
  } catch (err) {
    catchError(err, req, res, { function: "getSurveyDashboard", courseId });
  }
};
exports.duplicateForm = async (req, res) => {
  const transaction = await sequelize.transaction();
  const { formId } = req.params;

  try {
    // 1. Vérifier si le formulaire existe
    const originalForm = await Form.findByPk(formId, {
      include: [
        {
          model: FormQuestion,
          as: "FormQuestions",
          include: [
            { model: FormOption, as: "FormOptions" },
            { model: File, as: "files" },
          ],
        },
      ],
      transaction,
    });

    if (!originalForm) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Form not found",
      });
    }

    // 2. Créer le nouveau formulaire avec un titre modifié
    const newForm = await Form.create(
      {
        title: `${originalForm.title} (Copie)`,
        description: originalForm.description,
        courseId: originalForm.courseId,
        teamId: originalForm.teamId,
        type: originalForm.type,
        // is_active: true,
      },
      { transaction }
    );

    // 3. Copier toutes les questions
    for (const question of originalForm.FormQuestions || []) {
      const newQuestion = await FormQuestion.create(
        {
          form_id: newForm.id,
          question_text: question.question_text,
          question_type: question.question_type,
          is_required: question.is_required,
          points: question.points,
        },
        { transaction }
      );

      // 4. Copier les options de la question
      if (question.FormOptions && question.FormOptions.length > 0) {
        for (const option of question.FormOptions) {
          await FormOption.create(
            {
              question_id: newQuestion.id,
              option_text: option.option_text,
              side: option.side,
              orderIndex: option.orderIndex,
              is_correct: option.is_correct,
            },
            { transaction }
          );
        }
      }

      // 5. Copier les fichiers de la question
      if (question.files && question.files.length > 0) {
        for (const file of question.files) {
          await File.create(
            {
              form_question_id: newQuestion.id,
              task_id: file.task_id,
              s3BucketName: file.s3BucketName,
              s3Key: file.s3Key,
              name: file.name,
              size: file.size,
              type: file.type,
              isPatbass: file.isPatbass,
              isFileResponse: file.isFileResponse,
            },
            { transaction }
          );
        }
      }
    }

    await transaction.commit();

    logger.info("Form duplicated", {
      originalFormId: formId,
      newFormId: newForm.id,
      newFormTitle: newForm.title,
      // questionsCount,
      userId: req.headers["x-user-id"],
    });

    // Retourner le nouveau formulaire créé
    const duplicatedForm = await Form.findByPk(newForm.id, {
      include: [
        {
          model: FormQuestion,
          as: "FormQuestions",
          include: [
            { model: FormOption, as: "FormOptions" },
            { model: File, as: "files" },
          ],
        },
      ],
    });

    return res.status(201).json({
      success: true,
      message: "Form duplicated successfully",
      data: duplicatedForm,
    });
  } catch (error) {
    await transaction.rollback();
    return catchError(error, req, res, { function: "form.duplicateForm" });
  }
};

exports.getFormsForPicker = async (req, res) => {
  const courseId = req.params.courseId;
  const teamId = req.query.teamId;
  const formType = req.query.type;

  try {
    const whereCondition = {
      courseId: parseInt(courseId),
    };

    if (formType && ["test", "survey"].includes(formType)) {
      whereCondition.type = formType;
    }

    if (teamId && !isNaN(teamId)) {
      whereCondition[Op.or] = [{ teamId: parseInt(teamId) }, { teamId: null }];
    }

    const forms = await Form.findAll({
      where: whereCondition,
      order: [["createdAt", "DESC"]],
    });

    res.json(forms);
  } catch (err) {
    catchError(err, req, res, { function: "getFormsForPicker", courseId });
  }
};
