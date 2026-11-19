const db = require('../../models');
const CourseBatchFolderFile = db.CourseBatchFolderFile;


async function createFile(data) {
  const file = await CourseBatchFolderFile.create({
    folder_id: data.folder_id,
    name: data.name,
    type: data.type || null,
    size: data.size || null,
    s3_key: data.s3_key,
    s3_bucket_name: data.s3_bucket_name || null,
    created_by: data.created_by || null,
  });
  return file;
}

async function getFilesByFolderId(folderId) {
  const files = await CourseBatchFolderFile.findAll({
    where: { folder_id: folderId },
    include: [
      {
        model: db.User,
        as: 'creator',
        attributes: ['id', 'name', 'username'],
      },
    ],
    order: [['created_at', 'DESC']],
  });
  return files;
}

async function deleteFile(fileId) {
  const file = await CourseBatchFolderFile.findByPk(fileId);
  
  if (!file) {
    return false;
  }
  
  await file.destroy();
  return true;
}

async function getFileById(fileId) {
  const file = await CourseBatchFolderFile.findByPk(fileId, {
    include: [
      {
        model: db.User,
        as: 'creator',
        attributes: ['id', 'name', 'username'],
      },
    ],
  });
  return file;
}

module.exports = {
  createFile,
  getFilesByFolderId,
  deleteFile,
  getFileById,
};