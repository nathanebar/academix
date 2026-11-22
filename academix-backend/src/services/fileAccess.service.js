// File access for AUTHENTICATED requests (#13). The client's `teamId` / `teamMemberId` query
// params are no longer an authorization: before, `teamId` alone granted access to any file.
// A user may read a file when at least one of these holds:
// 1. they created it;
// 2. it is in the scope of one of their staff roles (every role but STUDENT: team
//    commander, overlap, course / domain / system manager, admin):
//    - a submission or feedback file (linked to a task assignment): the assignment's TEAM
//      must be in their allowed teams (a commander does not see another team's submissions);
//    - a task file: the task's team, or for a course-level task (no team) its course;
//    - a form question file: the form's course;
// 3. the existing student rules (file.service canAccessFile) pass for one of their own team
//    memberships, or for the `teamMemberId` sent by the client when that student is in a
//    team they supervise ("view as student").
// Requests without a token keep the old checks until step 3 of #13.
const { QueryTypes } = require("sequelize");
const { sequelize, File, TeamMember, CourseBatchFolderFile, CourseBatchFolder } = require("../../models");
const { getPermissionsForUser } = require("./permissions.service");
const { canAccessFile, canAccessCustomFolderFile } = require("./file.service");

const toId = (value) => (/^\d+$/.test(String(value ?? "").trim()) ? Number(value) : null);

// Staff scope (union of the user's own non-STUDENT role assignments) + team memberships,
// computed once per request.
const getUserAccess = async (req) => {
  if (req.fileAccess) return req.fileAccess;
  const userId = req.user.id;
  const [entries, memberships] = await Promise.all([
    getPermissionsForUser(userId),
    TeamMember.findAll({ where: { user_id: userId }, attributes: ["id", "team_id"], raw: true }),
  ]);
  const staffEntries = entries.filter((e) => e.user_id === userId && e.role_code !== "STUDENT");
  const union = (field) => new Set(staffEntries.flatMap((e) => e[field] || []));
  req.fileAccess = {
    teams: union("allowedTeamIds"),
    courses: union("allowedCourseIds"),
    batches: union("allowedCourseBatcheIds"),
    memberIds: memberships.map((m) => m.id),
  };
  return req.fileAccess;
};

// The user's own team memberships, plus the claimed one if that student is in a team the
// user supervises.
const studentCandidates = async (access, claimedTeamMemberId) => {
  const ids = new Set(access.memberIds);
  const claimed = toId(claimedTeamMemberId);
  if (claimed && !ids.has(claimed)) {
    const member = await TeamMember.findByPk(claimed, { attributes: ["id", "team_id"], raw: true });
    if (member && access.teams.has(member.team_id)) ids.add(claimed);
  }
  return [...ids];
};

const staffCanAccess = async (file, access) => {
  if (access.teams.size === 0 && access.courses.size === 0) return false;
  const [scope] = await sequelize.query(
    `SELECT t.team_id AS "taskTeam", ax."courseId" AS "taskCourse",
            ta.team_id AS "assignmentTeam", fo."courseId" AS "formCourse"
     FROM "Files" f
     LEFT JOIN "Tasks" t ON t.id = f.task_id
     LEFT JOIN "TaskGroups" tg ON tg.id = t."taskGroupId"
     LEFT JOIN "Axes" ax ON ax.id = tg."axisId"
     LEFT JOIN "FeedbackAnswers" fa ON fa.id = f.feedback_answer_id
     LEFT JOIN "TaskAssignments" ta ON ta.id = COALESCE(f.task_assignment_id, fa.task_assignment_id)
     LEFT JOIN "FormQuestions" fq ON fq.id = f.form_question_id
     LEFT JOIN "Forms" fo ON fo.id = fq.form_id
     WHERE f.id = :fileId`,
    { replacements: { fileId: file.id }, type: QueryTypes.SELECT }
  );
  if (!scope) return false;
  if (scope.assignmentTeam) return access.teams.has(scope.assignmentTeam);
  if (scope.taskTeam) return access.teams.has(scope.taskTeam);
  if (scope.taskCourse) return access.courses.has(scope.taskCourse);
  if (scope.formCourse) return access.courses.has(scope.formCourse);
  return false;
};

/** Whether the authenticated user may read the `Files` row `file`. */
const canUserAccessFile = async (req, file, { teamMemberId } = {}) => {
  if (!file) return false;
  if (file.creator_id && file.creator_id === req.user.id) return true;
  const access = await getUserAccess(req);
  if (await staffCanAccess(file, access)) return true;
  for (const memberId of await studentCandidates(access, teamMemberId)) {
    if (await canAccessFile(file, memberId, null)) return true;
  }
  return false;
};

/**
 * Same for an S3 key: several `Files` rows can share one key (uploadFile reuses an existing
 * object), access to any of them is enough. Returns { found, allowed, file }.
 */
const canUserAccessKey = async (req, key, { teamMemberId } = {}) => {
  const files = await File.findAll({ where: { s3Key: key } });
  for (const file of files) {
    if (await canUserAccessFile(req, file, { teamMemberId })) return { found: true, allowed: true, file };
  }
  return { found: files.length > 0, allowed: false, file: files[0] || null };
};

/** Folder files (course_batch_folder_files): creator, staff of the folder's team / batch,
 * or the existing student rules. */
const canUserAccessFolderFile = async (req, key, { teamMemberId } = {}) => {
  const folderFile = await CourseBatchFolderFile.findOne({ where: { s3_key: key }, raw: true });
  if (!folderFile) return false;
  const folder = await CourseBatchFolder.findByPk(folderFile.folder_id, { raw: true });
  if (!folder) return false;
  if (folderFile.created_by === req.user.id || folder.created_by === req.user.id) return true;

  const access = await getUserAccess(req);
  if (folder.team_id && access.teams.has(folder.team_id)) return true;
  if (!folder.team_id && !folder.team_member_id && access.batches.has(folder.course_batch_id)) return true;

  for (const memberId of await studentCandidates(access, teamMemberId)) {
    if (await canAccessCustomFolderFile(key, memberId, null)) return true;
  }
  return false;
};

module.exports = { canUserAccessFile, canUserAccessKey, canUserAccessFolderFile };
