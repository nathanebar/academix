// Extra demo data for seed-demo.js (issue #151): a test form, a survey, a feedback, an overlap user
// with overlap assignments, and files, all on course "קורס פיתוח תוכנה", batch "מחזור א' 2026",
// team "צוות 1". The rows mirror what the app creates (form.controller.js, formSubmission,
// feedback.controller.js updateFeedbackComplete, taskAssignmentHoef addHoef, file uploads).
// Runs inside the transaction of seed-demo.js; does nothing if the demo form already exists.
const { S3Client, PutObjectCommand, CreateBucketCommand, HeadBucketCommand } = require("@aws-sdk/client-s3");
const { hashPassword } = require("../src/utils/password");

const COURSE = "קורס פיתוח תוכנה";
const BATCH = "מחזור א' 2026";
const TEAM = `צוות 1 – ${COURSE} – ${BATCH}`;
const FORM_TITLE = "מבחן דמו – יסודות תכנות";
const SURVEY_TITLE = "סקר שביעות רצון – דמו";
const FEEDBACK_NAME = "משוב דמו – הרצאת פתיחה";

// Uploads small text objects to S3/MinIO. Returns false (and the caller skips the file rows)
// when storage is not reachable, so the rest of the demo data is still created.
const uploadObjects = async (bucket, objects) => {
  if (!process.env.S3_ENDPOINT) return false;
  const s3 = new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    credentials: { accessKeyId: process.env.S3_ACCESS_KEY, secretAccessKey: process.env.S3_SECRET_KEY },
    region: "us-east-1",
    forcePathStyle: true,
  });
  try {
    try {
      await s3.send(new HeadBucketCommand({ Bucket: bucket }));
    } catch {
      await s3.send(new CreateBucketCommand({ Bucket: bucket }));
    }
    for (const o of objects) {
      await s3.send(
        new PutObjectCommand({ Bucket: bucket, Key: o.key, Body: Buffer.from(o.body, "utf8"), ContentType: "text/plain; charset=utf-8" })
      );
    }
    return true;
  } catch (err) {
    console.warn(`seed-demo: S3 storage not reachable (${err.message}), demo files skipped.`);
    return false;
  } finally {
    s3.destroy();
  }
};

module.exports = async (m, t) => {
  const opts = { transaction: t };
  if (await m.Form.findOne({ where: { title: FORM_TITLE }, ...opts })) {
    console.log("Demo extras already present, skipping them.");
    return;
  }

  const course = await m.Course.findOne({ where: { name: COURSE }, ...opts });
  const batch = course && (await m.CourseBatch.findOne({ where: { name: BATCH, courseId: course.id }, ...opts }));
  const team = await m.Team.findOne({ where: { name: TEAM }, ...opts });
  if (!course || !batch || !team) throw new Error(`demo extras: "${TEAM}" not found`);

  const members = await m.TeamMember.findAll({
    where: { team_id: team.id, course_batch_id: batch.id },
    order: [["id", "ASC"]],
    ...opts,
  });
  const tc = members.find((x) => x.member_role === "TEAM_COMMANDER");
  const students = members.filter((x) => x.member_role === "STUDENT");
  const tcUserId = tc.user_id;

  // The assignments of each student, in the order seed-demo.js created them (task k = day k).
  const assignmentsOf = async (member) =>
    m.TaskAssignment.findAll({ where: { user_id: member.id, team_id: team.id }, order: [["start", "ASC"]], ...opts });
  const byStudent = [];
  for (const s of students) byStudent.push(await assignmentsOf(s));
  const taskAt = (k) => byStudent[0][k].task_id;
  const doneAt = (k) =>
    byStudent.map((list, si) => ({ student: students[si], ta: list[k] })).filter(({ ta }) => ta.completed);

  const stats = { forms: 0, submissions: 0, feedbackAnswers: 0, hoefs: 0, files: 0 };

  // ---------- Test form on task k=1 ("תרגיל מעשי", requires submission) ----------
  const form = await m.Form.create(
    { courseId: course.id, teamId: null, title: FORM_TITLE, description: "מבחן קצר לדוגמה.", type: "test", creator: tcUserId, is_active: true, show_score_per_question: true },
    opts
  );
  const q = async (form_id, question_text, question_type, points, orderIndex) =>
    m.FormQuestion.create({ form_id, question_text, question_type, is_required: true, points, orderIndex }, opts);
  const opt = async (question_id, option_text, extra = {}) =>
    m.FormOption.create({ question_id, option_text, side: "none", orderIndex: 0, paireKey: null, is_correct: null, points: null, ...extra }, opts);

  const qAmerican = await q(form.id, "מהו טיפוס הנתונים של הערך 3.14?", "american", 10, 0);
  const americanOptions = [];
  for (const [i, text] of ["מספר שלם", "מספר עשרוני", "מחרוזת"].entries()) {
    americanOptions.push(await opt(qAmerican.id, text, { orderIndex: i }));
  }
  const qTrueFalse = await q(form.id, "לולאת for תמיד רצה לפחות פעם אחת.", "true_false", 10, 1);
  await opt(qTrueFalse.id, "", { is_correct: false });
  const qText = await q(form.id, "הסבר במשפט אחד מהי פונקציה.", "text", 10, 2);
  stats.forms++;
  await m.Task.update({ formId: form.id }, { where: { id: taskAt(1) }, ...opts });

  // Graded and published / graded only / not graded yet.
  for (const [i, { ta }] of doneAt(1).entries()) {
    const graded = i < 2;
    const answers = [
      { form_question_id: qAmerican.id, selected_option_id: americanOptions[i % 2 === 0 ? 1 : 0].id, pointEarned: graded ? (i % 2 === 0 ? 10 : 0) : null },
      { form_question_id: qTrueFalse.id, value_text: i % 2 === 0 ? "לא נכון" : "נכון", pointEarned: graded ? (i % 2 === 0 ? 10 : 0) : null },
      { form_question_id: qText.id, value_text: "קטע קוד עם שם שמקבל קלט ומחזיר פלט.", pointEarned: graded ? 8 : null, instructor_note: graded ? "יפה, חסרה דוגמה." : null },
    ];
    const sub = await m.FormSubmission.create(
      {
        task_assignment_id: ta.id,
        form_id: form.id,
        started_at: ta.start,
        submitted_at: ta.end,
        score: graded ? answers.reduce((sum, a) => sum + a.pointEarned, 0) : null,
        is_published: i === 0,
      },
      opts
    );
    for (const a of answers) await m.FormSubmissionAnswer.create({ form_submission_id: sub.id, ...a }, opts);
    stats.submissions++;
  }

  // ---------- Survey on task k=2 ----------
  const survey = await m.Form.create(
    { courseId: course.id, teamId: null, title: SURVEY_TITLE, description: "סקר אנונימי לדוגמה.", type: "survey", creator: tcUserId, is_active: true, show_score_per_question: false },
    opts
  );
  const sScale = await q(survey.id, "עד כמה השבוע היה מועיל?", "scale", null, 0);
  await opt(sScale.id, "בכלל לא", { orderIndex: 1 });
  await opt(sScale.id, "מאוד", { orderIndex: 5 });
  const sAmerican = await q(survey.id, "איזה נושא היה הכי מעניין?", "american", null, 1);
  const surveyOptions = [];
  for (const [i, text] of ["תכנות", "Web", "מסדי נתונים"].entries()) {
    surveyOptions.push(await opt(sAmerican.id, text, { orderIndex: i }));
  }
  const sText = await q(survey.id, "מה היית משפר?", "text", null, 2);
  stats.forms++;
  await m.Task.update({ surveyId: survey.id }, { where: { id: taskAt(2) }, ...opts });

  for (const [i, { ta }] of doneAt(2).entries()) {
    const sub = await m.FormSubmission.create(
      { task_assignment_id: ta.id, form_id: survey.id, started_at: ta.start, submitted_at: ta.end, score: null, is_published: false },
      opts
    );
    await m.FormSubmissionAnswer.create({ form_submission_id: sub.id, form_question_id: sScale.id, value_number: 3 + (i % 3) }, opts);
    await m.FormSubmissionAnswer.create({ form_submission_id: sub.id, form_question_id: sAmerican.id, selected_option_id: surveyOptions[i % 3].id }, opts);
    await m.FormSubmissionAnswer.create({ form_submission_id: sub.id, form_question_id: sText.id, value_text: i % 2 ? "יותר תרגול" : "הפסקות ארוכות יותר" }, opts);
    stats.submissions++;
  }

  // ---------- Feedback on task k=3, filled by the team commander ----------
  const feedback = await m.Feedback.create(
    { name: FEEDBACK_NAME, select_option_score: 10, team_id: null, courseId: course.id, created_by: tcUserId, is_active: true, seenGrade: true },
    opts
  );
  const categories = [];
  for (const category of ["עבודת צוות", "יוזמה", "דיוק"]) {
    categories.push(await m.FeedbackCategory.create({ feedback_id: feedback.id, category }, opts));
  }
  const fQuestion = await m.FeedbackQuestion.create({ feedback_id: feedback.id, question_text: "מה החניך עשה טוב?" }, opts);
  await m.Task.update({ feedbackId: feedback.id }, { where: { id: taskAt(3) }, ...opts });

  for (const [i, { ta }] of doneAt(3).entries()) {
    await m.FeedbackAnswer.create(
      {
        feedback_id: feedback.id,
        task_assignment_id: ta.id,
        team_member_id: tc.id, // the member who filled it (see updateFeedbackComplete)
        text_comment: i % 2 ? "עבודה טובה, להמשיך כך." : "התקדמות יפה, לשים לב לפרטים.",
        summary_grade: 70 + i * 8, // 0–100 when select_option_score is 10 (TaskAssignmentCard)
        selectedOptionLabel: null,
        leaders_only_comment: i === 0 ? "לשקול תפקיד חונך." : null,
        is_viewable: true,
      },
      opts
    );
    await m.FeedbackCategorySelection.create({ feedback_id: feedback.id, category_id: categories[i % 3].id, task_assignment_id: ta.id, selection_type: "preservation" }, opts);
    await m.FeedbackCategorySelection.create({ feedback_id: feedback.id, category_id: categories[(i + 1) % 3].id, task_assignment_id: ta.id, selection_type: "improvement" }, opts);
    await m.FeedbackQuestionAnswer.create({ task_assignment_id: ta.id, question_id: fQuestion.id, answer_text: "הגיע מוכן ועזר לחברים." }, opts);
    stats.feedbackAnswers++;
  }

  // ---------- Overlap user and overlap assignments ----------
  const ovUser = await m.User.create(
    { username: "ov_c1b1t1", name: "חופף צוות 1 (מחזור א' 2026)", militaryid: "2000001", password: await hashPassword("1234") },
    opts
  );
  const ov = await m.TeamMember.create({ team_id: team.id, user_id: ovUser.id, course_batch_id: batch.id, member_role: "OVERLAP" }, opts);
  await m.RoleAssignment.create({ user_id: ovUser.id, role_code: "OVERLAP", scope_type: "team", scope_id: team.id }, opts);
  for (const [si, list] of byStudent.entries()) {
    const ta = list[si % 2 === 0 ? 1 : 3];
    const deadline = new Date(ta.end.getTime() + 7 * 24 * 3600 * 1000);
    await m.TaskAssignmentHofef.create({ task_assignment_id: ta.id, team_member_id: si < 4 ? ov.id : tc.id, deadline }, opts);
    stats.hoefs++;
  }

  // ---------- Files: task attachment, student response, knowledge-retention folder ----------
  const bucket = process.env.S3_BUCKET_NAME || "academix";
  const responder = doneAt(1)[0];
  const objects = [
    { key: "demo_seed_syllabus.txt", name: "סילבוס.txt", body: "סילבוס לדוגמה – קורס פיתוח תוכנה.\n" },
    { key: "demo_seed_response.txt", name: "הגשה.txt", body: "הגשת חניך לדוגמה.\n" },
    { key: "demo_seed_folder_file.txt", name: "סיכום שיעור.txt", body: "סיכום שיעור לדוגמה.\n" },
  ];
  const folder = await m.CourseBatchFolder.create(
    { course_batch_id: batch.id, name: "חומרי עזר", color: "gray", repository_kind: "operational", team_id: team.id, team_member_id: null, created_by: tcUserId },
    opts
  );
  if (await uploadObjects(bucket, objects)) {
    const size = (o) => Buffer.byteLength(o.body, "utf8");
    const fileRow = (o, extra) => ({ s3BucketName: bucket, s3Key: o.key, name: o.name, size: size(o), type: "text/plain", isPatbass: false, ...extra });
    await m.File.create(fileRow(objects[0], { task_id: taskAt(0), creator_id: tcUserId, isFileResponse: false }), opts);
    await m.File.create(
      fileRow(objects[1], { task_id: taskAt(1), task_assignment_id: responder.ta.id, creator_id: responder.student.user_id, isFileResponse: true }),
      opts
    );
    await m.CourseBatchFolderFile.create(
      { folder_id: folder.id, name: objects[2].name, type: "text/plain", size: size(objects[2]), s3_key: objects[2].key, s3_bucket_name: bucket, created_by: tcUserId },
      opts
    );
    stats.files = 3;
  }

  console.log("Demo extras created:", stats);
};
