const { config } = require("dotenv");
const { File, Sequelize } = require("../../models");
const { S3Client, HeadObjectCommand } = require("@aws-sdk/client-s3");
const {
  PutObjectCommand: UploadObject,
  CreateBucketCommand: CreateBucket,
  DeleteObjectCommand: DeleteObject,
} = require("@aws-sdk/client-s3");
const {
  createFile,
  getFilesByTaskId,
  getFilesByKey,
  getFilesByFeedbackAnswerId,
  getFilesBySolutionFileId,
  getFilesByCourseBatchId,
} = require("../services/file.service");

const { encodeBuffer } = require("../utils/encodeVideo");
const logger = require("../utils/logger");
const { catchError } = require("../utils/errorHandler");
const { fileStream } = require("../middlewares/upload");
const { sendS3Object } = require("../utils/s3Stream");
const { canUserAccessKey, canUserAccessFolderFile } = require("../services/fileAccess.service");
const { CourseBatchFolderFile } = require("../../models");

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

/**
 * Access check shared by streamFile and downloadFile. Returns:
 * - { status: "ok", fileRecord, bucket } (bucket: from the DB for authenticated requests),
 * - { status: "not_found" }: no Files row and no accessible folder file,
 * - { status: "forbidden" }: a Files row exists but the user may not read it.
 * Access is decided by fileAccess.service from the authenticated user (#13): the
 * teamMemberId param is only a "view as student" hint, teamId is ignored. Without a user
 * (only possible with REQUIRE_AUTH=false) nothing is readable.
 */
const authorizeFile = async (req, key, { teamMemberId }) => {
  if (!req.user) return { status: "forbidden" };
  const { found, allowed, file } = await canUserAccessKey(req, key, { teamMemberId });
  if (found) {
    return allowed ? { status: "ok", fileRecord: file, bucket: file.s3BucketName } : { status: "forbidden" };
  }
  if (await canUserAccessFolderFile(req, key, { teamMemberId })) {
    const folderFile = await CourseBatchFolderFile.findOne({ where: { s3_key: key }, raw: true });
    return { status: "ok", fileRecord: null, bucket: folderFile?.s3_bucket_name };
  }
  return { status: "not_found" };
};

exports.streamFile = async (req, res) => {
  const { bucket, key, teamMemberId, teamId } = req.query;

  if (!bucket || !key) {
    return res.status(400).json({ message: "Missing bucket or key parameters" });
  }

  try {
    const access = await authorizeFile(req, key, { teamMemberId, teamId });
    if (access.status === "not_found") {
      return res.status(404).json({ message: "File not found or access denied" });
    }
    if (access.status === "forbidden") {
      return res.status(403).json({ message: "Access denied" });
    }

    await sendS3Object(s3Client, req, res, {
      bucket: access.bucket || bucket,
      key,
      headers: { "Content-Disposition": "inline" },
    });
  } catch (error) {
    catchError(error, req, res, { function: "streamFile", bucket, key });
  }
};

exports.getFileById = async (req, res) => {
  const { id } = req.headers;

  if (!id) {
    return res.status(400).json({ message: "File id missing in headers" });
  }

  try {
    const file = await File.findByPk(id);

    if (!file) {
      return res.status(404).json({ message: `File with id ${id} not found` });
    }
    res.status(200).json(file);
  } catch (error) {
    catchError(error, req, res, { function: "getFileById", fileId: id });
  }
};

exports.getFilesByTaskId = async (req, res) => {
  const { taskid } = req.headers;
  try {
    const files = await getFilesByTaskId(taskid);
    res.status(200).json(files);
  } catch (error) {
    catchError(error, req, res, {
      function: "getFilesByTaskId",
      taskId: taskid,
    });
  }
};

exports.getFilesByFeedbackAnswerId = async (req, res) => {
  const { task_assignment_id } = req.headers;

  if (!task_assignment_id) {
    return res.status(400).json("Missing header: task_assignment_id");
  }

  try {
    const files = await getFilesByFeedbackAnswerId(task_assignment_id);
    res.status(200).json(files);
  } catch (error) {
    catchError(error, req, res, {
      function: "getFilesByFeedbackAnswerId",
      task_assignment_id,
    });
  }
};

exports.getFilesByCourseBatchId = async (req, res) => {
  const { coursebatchid, teammemberid, teamid } = req.headers;

  if (!coursebatchid) {
    return res.status(400).json({ message: "Missing header: coursebatchid" });
  }

  try {
    const files = await getFilesByCourseBatchId(
      Number(coursebatchid),
      teammemberid ? Number(teammemberid) : null,
      teamid ? Number(teamid) : null
    );
    res.status(200).json(files);
  } catch (error) {
    catchError(error, req, res, {
      function: "getFilesByCourseBatchId",
      coursebatchid,
    });
  }
};

exports.uploadFile = async (req, res) => {
  try {
    const { file } = req;
    const {
      bucket,
      key,
      taskId,
      feedback_answer_id,
      fileLength,
      isPatbass,
      originalFilename,
      form_question_id,
    } = req.body;

    const decodedFileName = originalFilename
      ? decodeURIComponent(originalFilename)
      : file.originalname;

    const isFileResponse = Boolean(req.body.isFileResponse);
    const task_assignment_id = Number(req.body.task_assignment_id);
    const FilesWithSameS3Key = await getFilesByKey(key);
    const creatorId = req.headers["x-user-id"]
      ? Number(req.headers["x-user-id"])
      : null;

    if (FilesWithSameS3Key?.length === 0) {
      const uploadParams = {
        Bucket: bucket,
        // Streamed from the temporary file written by middlewares/upload.js (not held in RAM).
        Body: fileStream(file),
        ContentLength: file.size,
        Key: key,
        ContentType: file.mimetype,
        ...(process.env.S3_STORAGE_CLASS ? { StorageClass: process.env.S3_STORAGE_CLASS } : {}),
        ACL: "public-read",
        ContentDisposition: "inline",
        CacheControl: "public, max-age=31536000",
        Metadata: {
          "Content-Type": file.mimetype,
          "File-Extension":
            file.originalname?.split(".")?.pop()?.toLowerCase() || "",
          "Original-Filename": encodeURIComponent(decodedFileName),
          "Processed-At": new Date().toISOString(),
        },
        ChecksumAlgorithm: "SHA256",
      };
      await s3Client.send(new UploadObject(uploadParams));

      logger.info("File uploaded to S3", {
        bucket,
        key,
        originalName: file?.originalname,
        size: file?.size,
        mimetype: file?.mimetype,
        userId: req.headers["x-user-id"],
      });
    }

    const savedFile = await createFile(
      taskId,
      feedback_answer_id,
      file,
      decodedFileName,
      fileLength,
      key,
      bucket,
      isPatbass,
      form_question_id,
      task_assignment_id,
      isFileResponse,
      creatorId
    );

    if (isFileResponse && task_assignment_id) {
      savedFile.isFileResponse = true;
      savedFile.task_assignment_id = task_assignment_id;
      await savedFile.save();
    }

    if (form_question_id) {
      savedFile.form_question_id = form_question_id;
      await savedFile.save();
    }

    if (decodedFileName && savedFile.name !== decodedFileName) {
      savedFile.name = decodedFileName;
      await savedFile.save();
    }

    logger.info("File saved to database", {
      fileId: savedFile.id,
      taskId,
      originalName: originalFilename,
      userId: req.headers["x-user-id"],
    });
    res.status(200).json(savedFile);
  } catch (error) {
    // catchError logs the error and answers 500 (the request used to hang here).
    catchError(error, req, res, {
      function: "uploadFile",
      bucket: req.body?.bucket,
      key: req.body?.key,
      taskId: req.body?.taskId,
    });
  }
};

exports.deleteByFeedback = async (req, res) => {
  try {
    const id = Number(req.body.feedback_answer_id);

    if (!Number.isInteger(id) || id < 0) {
      return res.status(400).json({ error: "feedback_answer_id אינו מספר תקין" });
    }

    const deletedCount = await File.destroy({
      where: { feedback_answer_id: id },
    });

    logger.info("Files deleted by feedback_answer_id", {
      feedbackAnswerId: id,
      deletedCount,
      userId: req.headers["x-user-id"],
    });

    return res.status(200).json({
      message: `נמחקו ${deletedCount} קבצים`,
      deletedCount,
    });
  } catch (error) {
    catchError(error, req, res, { function: "deleteByFeedback" });
  }
};

exports.createBucket = async (req, res) => {
  try {
    const bucketName = req.body.bucket;
    const commandParams = {
      Bucket: bucketName,
    };
    const response = await s3Client.send(new CreateBucket(commandParams));

    logger.info("Bucket created successfully", {
      bucketName,
      userId: req.headers["x-user-id"],
    });

    res.status(200).json("New Bucket Created");
  } catch (error) {
    catchError(error, req, res, { function: "createBucket", bucketName });
  }
};

exports.deleteFile = async (id) => {
  if (!id) {
    return {
      status: 409,
      error: "no id provided",
    };
  }
  try {
    const file = await File.findByPk(id);
    if (!file) {
      return {
        status: 409,
        error: "no file with that id to delete",
      };
    } else {
      const recordsOfSameKey = await File.findAll({
        where: {
          s3Key: file?.s3Key,
          [Sequelize.Op.or]: [
            { task_id: { [Sequelize.Op.ne]: Number(file?.task_id) } },
            Sequelize.and(
              { task_id: Number(file?.task_id) },
              { id: { [Sequelize.Op.ne]: Number(file?.id) } }
            ),
          ],
        },
      });
      if (!recordsOfSameKey || recordsOfSameKey?.length === 0) {
        const commandOptions = {
          Bucket: file?.s3BucketName,
          Key: file?.s3Key,
        };
        await s3Client.send(new DeleteObject(commandOptions));
      }
      await File.destroy({
        where: {
          id: Number(file?.id),
        },
      });

      logger.info("File deleted successfully", {
        fileId: id,
        bucket: file?.s3BucketName,
        key: file?.s3Key,
        userId: global?.req?.headers?.["x-user-id"],
      });

      return {
        status: 200,
        msg: "files delete successfully",
      };
    }
  } catch (error) {
    catchError(error, req, res, {
      function: "deleteFile",
      taskId: req.headers.taskid,
    });
  }
};

exports.deleteAllFilesByTaskId = async (req, res) => {
  try {
    const { taskid, ispatbass } = req.headers;
    const filesRecords = await File.findAll({
      where: {
        task_id: Number(taskid),
        isPatbass: ispatbass,
      },
    });

    if (filesRecords && filesRecords?.length > 0) {
      filesRecords?.forEach(async (file) => {
        const sameFileInOtherTask = await File.findAll({
          where: {
            s3BucketName: file?.s3BucketName,
            s3Key: file?.s3Key,
            task_id: {
              [Sequelize.Op.ne]: Number(taskid),
            },
          },
        });

        if (!sameFileInOtherTask || sameFileInOtherTask?.length === 0) {
          const commandOptions = {
            Bucket: file?.s3BucketName,
            Key: file?.s3Key,
          };
          await s3Client.send(new DeleteObject(commandOptions));
        }

        await File.destroy({
          where: { id: Number(file?.id) },
        });
      });

      logger.info("All files deleted", {
        taskId: taskid,
        filesCount: filesRecords?.length,
        userId: req.headers["x-user-id"],
      });

      res.status(200).json({ msg: `deleted all files releted to task ${taskid}` });
    } else {
      res.status(409).json({ error: `problem with deleting files` });
    }
  } catch (error) {
    catchError(error, req, res, {
      function: "deleteAllFilesByTaskId",
      taskId: req.headers.taskid,
    });
  }
};

// Headers of downloadFile: attachment with the original (UTF-8) name, never cached.
const downloadHeaders = (fileName) => ({
  "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
  "Cache-Control": "no-cache, no-store, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
});

exports.downloadFile = async (req, res) => {
  try {
    const { key, fileName, teamMemberId, teamId } = req.query;

    if (!key) {
      return res.status(400).json({ error: "Missing key parameter" });
    }

    const access = await authorizeFile(req, key, { teamMemberId, teamId });
    if (access.status === "not_found") {
      return res.status(404).json({ error: "File not found or access denied" });
    }
    if (access.status === "forbidden") {
      return res.status(403).json({ error: "Access denied" });
    }

    const fileRecord = access.fileRecord;
    const originalFileName =
      fileRecord?.name || fileName || key.split("/").pop() || "file";
    const s3Bucket =
      access.bucket || fileRecord?.s3BucketName || process.env.S3_BUCKET_NAME || "academix";

    await sendS3Object(s3Client, req, res, {
      bucket: s3Bucket,
      key,
      headers: downloadHeaders(originalFileName),
    });
  } catch (error) {
    catchError(error, req, res, {
      function: "downloadFile",
      key: req.query.key,
    });
  }
};