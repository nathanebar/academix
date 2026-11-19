const { sequelize, FormSubmission } = require("../../models");
const logger = require("../utils/logger");
const { catchError } = require("../utils/errorHandler");

async function getFormByTaskAssignmentId(
  taskAssignmentId,
  requestFor,
  issurvey,
  formId
) {
  try {
    let result = {};
    const taskAssignmentQuery = `
      SELECT jsonb_strip_nulls(to_jsonb(forms)) AS data 
      FROM public."TaskAssignments" as forms 
      WHERE id = :taskAssignmentId
    `;
    const taskAssignment = await sequelize.query(taskAssignmentQuery, {
      replacements: {
        taskAssignmentId: taskAssignmentId,
      },
      type: sequelize.QueryTypes.SELECT,
      raw: true,
    });

    if (!taskAssignment || !taskAssignment[0]?.data?.task_id) {
      return { error: "There Is No Such Task Assignment With This Id!" };
    }
    if (!requestFor) {
      return { error: "There Is No Request_for Sent!" };
    }
    result.taskAssignment = taskAssignment;

    // ==========================================
    // שאילתת FormQuestions משותפת (עם FormOptions AND Files)
    // ==========================================
    const formQuestionsSubQuery = `
    SELECT jsonb_agg(
      CASE 
        WHEN EXISTS (
            SELECT 1 FROM public."FormOptions" fo 
            WHERE fo."question_id" = fq.id
        ) THEN 
            jsonb_strip_nulls(
              jsonb_set(
                to_jsonb(fq),
                '{question_text}',
                to_jsonb(regexp_replace(fq.question_text, '_([^_]*)_', '_ _', 'g'))
              )
            ) || 
            jsonb_build_object(
              'FormOptions', (
                SELECT jsonb_agg(
                  jsonb_strip_nulls(
                    CASE 
                      WHEN fq.question_type = 'matching_pairs' THEN
                        (to_jsonb(fo) - 'id' - 'createdAt' - 'updatedAt' - 'paireKey' - 'orderIndex') 
                        || jsonb_build_object('id', md5(fo.id::text))
                      ELSE
                        (to_jsonb(fo) - 'id' - 'createdAt' - 'updatedAt' - 'paireKey') 
                        || jsonb_build_object('id', md5(fo.id::text))
                    END
                  )
                  ORDER BY RANDOM()
                )
                FROM public."FormOptions" fo
                WHERE fo."question_id" = fq.id
              ),
              'files', (
                SELECT COALESCE(jsonb_agg(
                  jsonb_strip_nulls(to_jsonb(f))
                ), '[]'::jsonb)
                FROM public."Files" f
                WHERE f."form_question_id" = fq.id
                  AND f."isFileResponse" = false
                  AND f."task_id" IS NULL
              )
            )
        ELSE 
            jsonb_strip_nulls(
              jsonb_set(
                to_jsonb(fq),
                '{question_text}',
                to_jsonb(regexp_replace(fq.question_text, '_([^_]*)_', '_ _', 'g'))
              )
            ) ||
            jsonb_build_object(
              'FormOptions', '[]'::jsonb,
              'files', (
                SELECT COALESCE(jsonb_agg(
                  jsonb_strip_nulls(to_jsonb(f))
                ), '[]'::jsonb)
                FROM public."Files" f
                WHERE f."form_question_id" = fq.id
                  AND f."isFileResponse" = false
                  AND f."task_id" IS NULL
              )
            )
      END
    )
    FROM public."FormQuestions" fq
    WHERE fq."form_id" = f.id
  `;

    // ==========================================
    // Grading
    // ==========================================
    if (requestFor === "grading") {
      const formSubmissionQuery = `
  SELECT jsonb_strip_nulls(
    to_jsonb(forms) || 
    jsonb_build_object('FormSubmissionAnswers', COALESCE((
        SELECT jsonb_agg(
            jsonb_strip_nulls(to_jsonb(fsa)) ||
            COALESCE((
                SELECT jsonb_strip_nulls(to_jsonb(f)) || 
                       jsonb_build_object(
                         'fileId', f.id,
                         'fileName', f.name
                       )
                FROM public."Files" f
                WHERE f."s3Key" = fsa."value_text"
                LIMIT 1
            ), '{}'::jsonb)
        )
        FROM public."FormSubmissionAnswers" fsa
        WHERE fsa."form_submission_id" = forms.id
    ), '[]'::jsonb))
  ) AS data
  FROM public."FormSubmissions" AS forms
  WHERE forms."task_assignment_id" = :taskAssignmentId
`;
      const formSubmission = await sequelize.query(formSubmissionQuery, {
        replacements: {
          taskAssignmentId: taskAssignmentId,
        },
        type: sequelize.QueryTypes.SELECT,
        raw: true,
      });
      if (formSubmission?.length > 0) {
        result.formSubmission = formSubmission;
        const formQuery = `
          SELECT jsonb_strip_nulls(
            to_jsonb(f) || 
            jsonb_build_object('FormQuestions', (${formQuestionsSubQuery}))
          ) AS data
          FROM public."Forms" AS f
          WHERE f.id = :formId
        `;
        const form = await sequelize.query(formQuery, {
          replacements: {
            formId: formSubmission?.[0]?.data?.form_id,
          },
          type: sequelize.QueryTypes.SELECT,
          raw: true,
        });
        if (form) {
          result.form = form;
        }
      }

      // ==========================================
      // Show
      // ==========================================
    } else if (requestFor === "show") {
      let targetFormId = null;

      if (issurvey === "true" || issurvey === true) {
        const taskQuery = `
      SELECT "surveyId" 
      FROM public."Tasks" 
      WHERE id = :taskId
    `;
        const taskResult = await sequelize.query(taskQuery, {
          replacements: { taskId: taskAssignment[0]?.data?.task_id },
          type: sequelize.QueryTypes.SELECT,
          raw: true,
        });
        targetFormId = taskResult?.[0]?.surveyId;
      } else {
        const taskQuery = `
      SELECT "formId" 
      FROM public."Tasks" 
      WHERE id = :taskId
    `;
        const taskResult = await sequelize.query(taskQuery, {
          replacements: { taskId: taskAssignment[0]?.data?.task_id },
          type: sequelize.QueryTypes.SELECT,
          raw: true,
        });
        targetFormId = taskResult?.[0]?.formId;
      }

      if (targetFormId) {
        const formQuery = `
      SELECT jsonb_strip_nulls(
        to_jsonb(f) || 
        jsonb_build_object('FormQuestions', (${formQuestionsSubQuery}))
      ) AS data
      FROM public."Forms" AS f
      WHERE f.id = :formId
    `;
        const form = await sequelize.query(formQuery, {
          replacements: {
            formId: targetFormId,
          },
          type: sequelize.QueryTypes.SELECT,
          raw: true,
        });
        if (form && form.length > 0) {
          result.form = form;
        }
      }

      const formSubmissionQuery = `
    SELECT jsonb_strip_nulls(
      to_jsonb(forms) || 
      jsonb_build_object('FormSubmissionAnswers', COALESCE((
          SELECT jsonb_agg(
              jsonb_strip_nulls(to_jsonb(fsa)) ||
              COALESCE((
                  SELECT jsonb_build_object(
                      'fileId', f.id,
                      'fileName', f.name,
                      'fileSize', f.size,
                      'fileType', f.type,
                      's3BucketName', f."s3BucketName"
                  )
                  FROM public."Files" f
                  WHERE f."s3Key" = fsa."value_text"
                  LIMIT 1
              ), '{}'::jsonb)
          )
          FROM public."FormSubmissionAnswers" fsa
          WHERE fsa."form_submission_id" = forms.id
      ), '[]'::jsonb))
    ) AS data
    FROM public."FormSubmissions" AS forms
    WHERE forms."task_assignment_id" = :taskAssignmentId
    ORDER BY forms."createdAt" DESC
    LIMIT 1
  `;

      const formSubmissionParams = { taskAssignmentId: taskAssignmentId };
      if (issurvey === "true" || issurvey === true) {
        formSubmissionParams.formId = targetFormId;
      }

      const formSubmission = await sequelize.query(formSubmissionQuery, {
        replacements: formSubmissionParams,
        type: sequelize.QueryTypes.SELECT,
        raw: true,
      });

      if (formSubmission && formSubmission.length > 0) {
        result.formSubmission = formSubmission;
      }
    } else if (requestFor === "answer" && taskAssignment[0]?.data?.task_id) {
      let targetFormId = formId;

      if (!targetFormId) {
        const taskResult = await sequelize.query(
          `
      SELECT "formId", "surveyId" FROM public."Tasks" WHERE id = :taskId
    `,
          {
            replacements: { taskId: taskAssignment[0]?.data?.task_id },
            type: sequelize.QueryTypes.SELECT,
            raw: true,
          }
        );

        if (issurvey === "true" || issurvey === true) {
          targetFormId = taskResult?.[0]?.surveyId;
        } else {
          targetFormId = taskResult?.[0]?.formId;
        }
      }

      if (issurvey === "true" || issurvey === true) {
        const taskQuery = `
      SELECT "surveyId" FROM public."Tasks" WHERE id = :taskId
    `;
        const taskResult = await sequelize.query(taskQuery, {
          replacements: { taskId: taskAssignment[0]?.data?.task_id },
          type: sequelize.QueryTypes.SELECT,
          raw: true,
        });
        const surveyId = taskResult?.[0]?.surveyId;

        const surveySubmissionCheck = `
  SELECT id, "submitted_at", "form_id" 
  FROM public."FormSubmissions" 
  WHERE "task_assignment_id" = :taskAssignmentId 
  AND "submitted_at" IS NOT NULL
  AND "form_id" = :surveyId
  LIMIT 1
`;

        const surveySubmission = await sequelize.query(surveySubmissionCheck, {
          replacements: {
            taskAssignmentId: taskAssignmentId,
            surveyId: surveyId,
          },
          type: sequelize.QueryTypes.SELECT,
          raw: true,
        });

        if (
          surveySubmission &&
          surveySubmission.length > 0 &&
          requestFor === "answer"
        ) {
          return {
            error: "כבר ענית על סקר זה",
          };
        }
      } else {
        const existingSubmission = await FormSubmission.findOne({
          where: {
            task_assignment_id: taskAssignmentId,
            form_id: targetFormId,
          },
        });
        if (existingSubmission) {
          return {
            error: "submission to this task assignment already exist!",
          };
        }
      }

      let formQuery = ``;
      if (issurvey === "true" || issurvey === true) {
        formQuery = `
      SELECT jsonb_strip_nulls(
        to_jsonb(f) || 
        jsonb_build_object('FormQuestions', (${formQuestionsSubQuery}))
      ) AS data
      FROM public."Tasks" AS t
      LEFT JOIN public."Forms" f ON f.id = t."surveyId" 
      WHERE t.id = :taskId
    `;
      } else {
        formQuery = `
      SELECT jsonb_strip_nulls(
        to_jsonb(f) || 
        jsonb_build_object('FormQuestions', (${formQuestionsSubQuery}))
      ) AS data
      FROM public."Tasks" AS t
      LEFT JOIN public."Forms" f ON f.id = t."formId" 
      WHERE t.id = :taskId
    `;
      }
      const form = await sequelize.query(formQuery, {
        replacements: {
          taskId: taskAssignment[0]?.data?.task_id,
        },
        type: sequelize.QueryTypes.SELECT,
        raw: true,
      });
      if (form) {
        result.form = form;
      }
    }
    if (!result) {
      return null;
    }
    return result;
  } catch (error) {
    console.error("Error in getFormByTaskAssignmentId:", error);
    throw error;
  }
}

async function getByFormId(formId) {
  if (!formId) {
    return { error: "there is no all needed params provided!" };
  }
  try {
    const query = `SELECT jsonb_strip_nulls(
    to_jsonb(f) ||
    jsonb_build_object(
        'FormQuestions',
        COALESCE((
            SELECT jsonb_agg(
                CASE 
                    WHEN EXISTS (
                        SELECT 1
                        FROM public."FormOptions" fo
                        WHERE fo."question_id" = fq.id
                    ) OR EXISTS (
                        SELECT 1
                        FROM public."Files" file
                        WHERE file.form_question_id = fq.id
                    ) THEN
                        jsonb_strip_nulls(to_jsonb(fq)) ||
                        jsonb_build_object(
                            'FormOptions',
                            (
                                SELECT jsonb_agg(
                                    jsonb_strip_nulls(to_jsonb(fo))
                                )
                                FROM public."FormOptions" fo
                                WHERE fo."question_id" = fq.id
                            )
                        ) ||
                        jsonb_build_object(
                        'Files',
                        (
                            SELECT jsonb_agg(
                                jsonb_strip_nulls(to_jsonb(file))
                            )
                            FROM public."Files" file
                            WHERE file.form_question_id = fq.id
                              AND file."isFileResponse" = false
                              AND file."task_id" IS NULL
                        )
                    )
                    ELSE
                        jsonb_strip_nulls(to_jsonb(fq)) ||
                        jsonb_build_object(
                            'FormOptions',
                            '[]'::jsonb
                        ) ||
                        jsonb_build_object(
                            'Files',
                            '[]'::jsonb
                        )
                END
            )
            FROM public."FormQuestions" fq
            WHERE fq."form_id" = f.id
        ), '[]'::jsonb)
    )
) AS data
FROM public."Forms" f
WHERE f.id = :formId`;

    const result = await sequelize.query(query, {
      replacements: {
        formId: formId,
      },
      type: sequelize.QueryTypes.SELECT,
      raw: true,
    });

    if (result) {
      return result;
    }
    return { error: "not found!" };
  } catch (error) {
    catchError(error, req, res);
    return { error };
  }
}

async function getUsersInTeamAndTask(
  taskId,
  teamId,
  selectedCourseBatch,
  isSurvey,
  formId
) {
  if (!teamId || !taskId) {
    return { error: "there is no all needed params provided!" };
  }
  if (!selectedCourseBatch) {
    return { error: "selectedCourseBatch is required!" };
  }

  // קבע איזה formId לבדוק
  let formIdCondition = "";
  if (formId) {
    formIdCondition = `AND fs.form_id = :formId`;
  } else if (isSurvey === "true" || isSurvey === true) {
    // אם זה סקר, קח את ה-surveyId מה-Task
    formIdCondition = `AND fs.form_id = t."surveyId"`;
  } else {
    // אם זה מבחן, קח את ה-formId מה-Task
    formIdCondition = `AND fs.form_id = t."formId"`;
  }

  const usersQuery = `
    SELECT
    jsonb_strip_nulls(
      jsonb_build_object(
        'users', jsonb_agg(
          jsonb_build_object(
            'id', tm."id",
            'name', u."name",
            'username', u."username",
            'militaryId', u."militaryid",
            'taskAssignmentId', ta.id,
            'hasSubmission', EXISTS(
              SELECT 1 
              FROM public."FormSubmissions" fs 
              JOIN public."Tasks" t ON t.id = ta."task_id"
              WHERE fs."task_assignment_id" = ta.id
              ${formIdCondition}
            ),
            'hasSurveySubmission', EXISTS(
              SELECT 1 
              FROM public."FormSubmissions" fs 
              JOIN public."Tasks" t ON t.id = ta."task_id"
              WHERE fs."task_assignment_id" = ta.id
              AND fs.form_id = t."surveyId"
            ),
            'score', (
              SELECT fs2.score 
              FROM public."FormSubmissions" fs2 
              WHERE fs2."task_assignment_id" = ta.id
              AND fs2.form_id = t."formId"
            ),
            'maxscore', (
              SELECT COALESCE(SUM(fq.points), 0)
              FROM public."Tasks" t2
              JOIN public."Forms" f ON t2."formId" = f.id
              JOIN public."FormQuestions" fq ON f.id = fq.form_id
              WHERE t2.id = ta."task_id"
            ),
            'scorePercentage', ROUND(
              (
                (SELECT COALESCE(fs3.score, 0) 
                 FROM public."FormSubmissions" fs3 
                 WHERE fs3."task_assignment_id" = ta.id
                 AND fs3.form_id = t."formId")::numeric
                / 
                NULLIF(
                  (SELECT COALESCE(SUM(fq.points), 0)
                   FROM public."Tasks" t3
                   JOIN public."Forms" f2 ON t3."formId" = f2.id
                   JOIN public."FormQuestions" fq ON f2.id = fq.form_id
                   WHERE t3.id = ta."task_id"
                  ), 0
                )
              ) * 100, 2
            )
          )
        )
      )
    ) AS data
    FROM public."TaskAssignments" ta
    JOIN public."TeamMembers" tm ON ta."user_id" = tm."id"
    JOIN public."Users" u ON tm."user_id" = u."id"
    JOIN public."Tasks" t ON t.id = ta."task_id"
    
    -- חיבור ל-TeamCourseBatches לסינון לפי מחזור
    JOIN public."TeamCourseBatches" tcb 
      ON tcb.team_id = ta."team_id" 
      AND tcb.course_batch_id = :selectedCourseBatch
    
    WHERE ta."team_id" = :teamId 
      AND ta."task_id" = :taskId
      AND tm.course_batch_id = :selectedCourseBatch;
  `;
  const result = await sequelize.query(usersQuery, {
    replacements: {
      teamId: teamId,
      taskId: taskId,
      selectedCourseBatch: selectedCourseBatch,
      formId: formId || null,
    },
    type: sequelize.QueryTypes.SELECT,
    raw: true,
  });

  if (result) {
    return result;
  }
  return { error: "not found!" };
}

module.exports = {
  getFormByTaskAssignmentId,
  getUsersInTeamAndTask,
  getByFormId,
};
