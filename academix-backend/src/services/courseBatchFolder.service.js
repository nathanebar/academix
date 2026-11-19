const db = require("../../models");
const CourseBatchFolder = db.CourseBatchFolder;

async function createFolder(data) {
  let teamId = data.team_id || null;
  let teamMemberId = data.team_member_id || null;

  if (teamMemberId) {
    teamId = null; 
  }

  const folder = await CourseBatchFolder.create({
    course_batch_id: data.course_batch_id,
    name: data.name,
    color: data.color || "gray",
    repository_kind: data.repository_kind || "operational",
    team_id: teamId,
    team_member_id: teamMemberId,
    created_by: data.created_by || null,
  });
  return folder;
}

async function getFoldersByCourseBatchId(
  courseBatchId,
  teamId = null,
  teamMemberId = null
) {
  const where = { course_batch_id: courseBatchId };

  if (teamMemberId) {
    where.team_member_id = teamMemberId;
    where.team_id = null;
  } else if (teamId) {
    where[require("sequelize").Op.or] = [
      { team_id: teamId },
      { team_id: null, team_member_id: null },
    ];
  } else {
    where.team_member_id = null;
  }

  const folders = await CourseBatchFolder.findAll({
    where,
    order: [["name", "ASC"]],
  });

  return folders;
}

async function updateFolder(folderId, data) {
  const folder = await CourseBatchFolder.findByPk(folderId);

  if (!folder) {
    return null;
  }

  if (data.name !== undefined) folder.name = data.name;
  if (data.color !== undefined) folder.color = data.color;
  if (data.repository_kind !== undefined)
    folder.repository_kind = data.repository_kind;

  await folder.save();
  return folder;
}

async function deleteFolder(folderId) {
  const folder = await CourseBatchFolder.findByPk(folderId);

  if (!folder) {
    return false;
  }

  await folder.destroy();
  return true;
}

async function getFolderById(folderId) {
  return await CourseBatchFolder.findByPk(folderId);
}

module.exports = {
  createFolder,
  getFoldersByCourseBatchId,
  updateFolder,
  deleteFolder,
  getFolderById,
};