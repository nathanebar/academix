// Deleting files together with the entities that own them (domain, course...), in two steps:
// 1. deleteFileRecords(): inside the caller's DB transaction, delete the `Files` rows and
//    return the S3 objects they pointed to;
// 2. deleteUnreferencedObjects(): AFTER the transaction has committed, delete those objects
//    from S3 / MinIO, unless another row still references the same key (the same key can be
//    shared: uploadFile skips the S3 upload when the key already exists).
// An S3 delete cannot be rolled back, so it must never happen before the commit.
const { S3Client, DeleteObjectsCommand } = require("@aws-sdk/client-s3");
const { File, FileResponse, CourseBatchFolderFile } = require("../../models");
const logger = require("../utils/logger");

const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
  region: "us-east-1",
  forcePathStyle: true,
});

const S3_BATCH_SIZE = 1000; // max keys per DeleteObjects call

/** Deletes the Files rows matching `where` in `transaction`; returns their { bucket, key }. */
const deleteFileRecords = async (where, transaction) => {
  const files = await File.findAll({
    where,
    attributes: ["id", "s3Key", "s3BucketName"],
    transaction,
  });
  if (files.length === 0) return [];
  await File.destroy({ where: { id: files.map((f) => f.id) }, transaction });
  return files.map((f) => ({ bucket: f.s3BucketName, key: f.s3Key }));
};

/**
 * Deletes from S3 the objects no longer referenced by Files, FileResponses or
 * course_batch_folder_files. Never throws: a failed S3 delete only leaves an orphan object,
 * it must not turn a committed delete into an error for the user.
 */
const deleteUnreferencedObjects = async (objects) => {
  const result = { deleted: 0, kept: 0, failed: 0 };
  const unique = new Map();
  for (const o of objects) {
    if (o?.bucket && o?.key) unique.set(`${o.bucket}\u0000${o.key}`, o);
  }
  if (unique.size === 0) return result;

  try {
    const keys = [...new Set([...unique.values()].map((o) => o.key))];
    const [files, responses, folderFiles] = await Promise.all([
      File.findAll({ where: { s3Key: keys }, attributes: ["s3Key"], raw: true }),
      FileResponse.findAll({ where: { s3Key: keys }, attributes: ["s3Key"], raw: true }),
      CourseBatchFolderFile.findAll({ where: { s3_key: keys }, attributes: ["s3_key"], raw: true }),
    ]);
    const stillUsed = new Set([
      ...files.map((f) => f.s3Key),
      ...responses.map((f) => f.s3Key),
      ...folderFiles.map((f) => f.s3_key),
    ]);

    const byBucket = new Map();
    for (const { bucket, key } of unique.values()) {
      if (stillUsed.has(key)) {
        result.kept++;
        continue;
      }
      if (!byBucket.has(bucket)) byBucket.set(bucket, []);
      byBucket.get(bucket).push(key);
    }

    for (const [bucket, bucketKeys] of byBucket) {
      for (let i = 0; i < bucketKeys.length; i += S3_BATCH_SIZE) {
        const chunk = bucketKeys.slice(i, i + S3_BATCH_SIZE);
        try {
          const response = await s3Client.send(
            new DeleteObjectsCommand({
              Bucket: bucket,
              Delete: { Objects: chunk.map((Key) => ({ Key })), Quiet: true },
            })
          );
          const errors = response.Errors || [];
          result.failed += errors.length;
          result.deleted += chunk.length - errors.length;
          errors.forEach((e) =>
            logger.warn("S3 object not deleted", { bucket, key: e.Key, originalError: e.Message || e.Code })
          );
        } catch (error) {
          result.failed += chunk.length;
          logger.warn("S3 batch delete failed", { bucket, keys: chunk.length, originalError: error.message });
        }
      }
    }
  } catch (error) {
    logger.warn("S3 clean-up skipped", { objects: unique.size, originalError: error.message });
    result.failed = unique.size;
  }
  return result;
};

module.exports = { deleteFileRecords, deleteUnreferencedObjects };
