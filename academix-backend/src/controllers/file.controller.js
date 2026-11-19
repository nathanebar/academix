const { config } = require("dotenv");
const { File, Sequelize } = require("../../models");
const { S3Client, HeadObjectCommand } = require("@aws-sdk/client-s3");
const {
  GetObjectCommand: GetObject,
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
  canAccessFile,
  canAccessCustomFolderFile,
} = require("../services/file.service");

const { encodeBuffer } = require("../utils/encodeVideo");
const logger = require("../utils/logger");
const { catchError } = require("../utils/errorHandler");

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

exports.streamFile = async (req, res) => {
  const { bucket, key, teamMemberId, teamId } = req.query;

  if (!bucket || !key) {
    return res.status(400).json({ message: "Missing bucket or key parameters" });
  }

  try {
    // 1. ננסה קובץ רגיל
    let fileRecord = await File.findOne({ where: { s3Key: key } });

    // 2. אם לא נמצא – ננסה קובץ מתיקייה מותאמת
    if (!fileRecord) {
      const hasFolderAccess = await canAccessCustomFolderFile(
        key,
        teamMemberId ? Number(teamMemberId) : null,
        teamId ? Number(teamId) : null
      );

      if (!hasFolderAccess) {
        return res.status(404).json({ message: "File not found or access denied" });
      }

      const downloadParams = { Bucket: bucket, Key: key };
      const response = await s3Client.send(new GetObject(downloadParams));

      res.set("Content-Type", response.ContentType);
      res.setHeader("Content-Disposition", "inline");
      return response.Body.pipe(res);
    }

    // 3. קובץ רגיל – בדיקת הרשאות רגילה
    const hasAccess = await canAccessFile(
      fileRecord,
      teamMemberId ? Number(teamMemberId) : null,
      teamId ? Number(teamId) : null
    );

    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied" });
    }

    const downloadParams = { Bucket: bucket, Key: key };
    const response = await s3Client.send(new GetObject(downloadParams));

    res.set("Content-Type", response.ContentType);
    res.setHeader("Content-Disposition", "inline");
    response.Body.pipe(res);
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
        Body: file.buffer,
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
    logger.error("Failed to upload file", {
      bucket: req.body.bucket,
      key: req.body.key,
      taskId: req.body.taskId,
      error: error.message,
      userId: req.headers["x-user-id"],
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
      status: 401,
      error: "no id provided",
    };
  }
  try {
    const file = await File.findByPk(id);
    if (!file) {
      return {
        status: 401,
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
      res.status(401).json({ error: `problem with deleting files` });
    }
  } catch (error) {
    catchError(error, req, res, {
      function: "deleteAllFilesByTaskId",
      taskId: req.headers.taskid,
    });
  }
};

exports.downloadFile = async (req, res) => {
  try {
    const { key, fileName, teamMemberId, teamId } = req.query;

    if (!key) {
      return res.status(400).json({ error: "Missing key parameter" });
    }

    // 1. ננסה קובץ רגיל
    let fileRecord = await File.findOne({ where: { s3Key: key } });

    // 2. אם לא נמצא – ננסה קובץ מתיקייה מותאמת
    if (!fileRecord) {
      const hasFolderAccess = await canAccessCustomFolderFile(
        key,
        teamMemberId ? Number(teamMemberId) : null,
        teamId ? Number(teamId) : null
      );

      if (!hasFolderAccess) {
        return res.status(404).json({ error: "File not found or access denied" });
      }

      const s3Bucket = process.env.S3_BUCKET_NAME || "academix";
      const downloadParams = { Bucket: s3Bucket, Key: key };
      const response = await s3Client.send(new GetObject(downloadParams));

      const originalFileName = fileName || key.split("/").pop() || "file";
      res.setHeader("Content-Type", response.ContentType || "application/octet-stream");
      res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(originalFileName)}`);
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      return response.Body.pipe(res);
    }

    // 3. קובץ רגיל – בדיקת הרשאות רגילה
    const hasAccess = await canAccessFile(
      fileRecord,
      teamMemberId ? Number(teamMemberId) : null,
      teamId ? Number(teamId) : null
    );

    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    let originalFileName =
      fileRecord.name || fileName || key.split("/").pop() || "file";
    let s3Bucket =
      fileRecord.s3BucketName || process.env.S3_BUCKET_NAME || "academix";

    const downloadParams = { Bucket: s3Bucket, Key: key };
    const response = await s3Client.send(new GetObject(downloadParams));

    res.setHeader(
      "Content-Type",
      response.ContentType || "application/octet-stream"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(originalFileName)}`
    );
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    if (response.Body) {
      response.Body.pipe(res);
    } else {
      return res.status(500).json({ error: "Failed to get file from S3" });
    }
  } catch (error) {
    console.error("Download file error:", error);
    catchError(error, req, res, {
      function: "downloadFile",
      key: req.query.key,
    });
  }
};