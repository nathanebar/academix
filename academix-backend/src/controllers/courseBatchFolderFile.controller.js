const courseBatchFolderFileService = require('../services/courseBatchFolderFile.service');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const logger = require('../utils/logger');
const { catchError } = require('../utils/errorHandler');
const { fileStream } = require('../middlewares/upload');

const endpoint = process.env.S3_ENDPOINT;
const accessKey = process.env.S3_ACCESS_KEY;
const secretKey = process.env.S3_SECRET_KEY;

const s3Client = new S3Client({
  endpoint,
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretKey,
  },
  region: "us-east-1",
  forcePathStyle: true,
});

exports.uploadFile = async (req, res) => {
  try {
    const { file } = req;
    const { folder_id, bucket, key, original_filename } = req.body;

    if (!folder_id || !key) {
      return res.status(400).json({ message: 'folder_id and key are required' });
    }

    const uploadParams = {
      Bucket: bucket,
      Key: key,
      // Streamed from the temporary file written by middlewares/upload.js (not held in RAM).
      Body: fileStream(file),
      ContentLength: file.size,
      ContentType: file.mimetype,
      ACL: "public-read",
      ...(process.env.S3_STORAGE_CLASS ? { StorageClass: process.env.S3_STORAGE_CLASS } : {}),
      ContentDisposition: "inline",
      CacheControl: "public, max-age=31536000",
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    const created_by = req.headers['x-user-id'] ? Number(req.headers['x-user-id']) : null;

    const fileRecord = await courseBatchFolderFileService.createFile({
      folder_id: Number(folder_id),
      name: original_filename ? decodeURIComponent(original_filename) : file.originalname,
      type: file.mimetype,
      size: file.size,
      s3_key: key,
      s3_bucket_name: bucket,
      created_by,
    });

    logger.info('File uploaded to S3 and folder', {
      fileId: fileRecord.id,
      folderId: folder_id,
      userId: created_by,
    });

    res.status(201).json(fileRecord);
  } catch (error) {
    catchError(error, req, res, { function: 'uploadFileToFolder' });
  }
};


exports.getFilesByFolderId = async (req, res) => {
  try {
    const { folderid } = req.params;

    if (!folderid) {
      return res.status(400).json({ message: 'folderid is required' });
    }

    const files = await courseBatchFolderFileService.getFilesByFolderId(Number(folderid));

    res.status(200).json(files);
  } catch (error) {
    catchError(error, req, res, { function: 'getFilesByFolderId' });
  }
};

exports.deleteFile = async (req, res) => {
  try {
    const { id } = req.params;

    const file = await courseBatchFolderFileService.getFileById(Number(id));

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    try {
      await s3Client.send(new DeleteObjectCommand({
        Bucket: file.s3_bucket_name,
        Key: file.s3_key,
      }));
    } catch (s3Error) {
      logger.warn('Failed to delete file from S3', { key: file.s3_key });
    }

    await courseBatchFolderFileService.deleteFile(Number(id));

    logger.info('File deleted', {
      fileId: id,
      userId: req.headers['x-user-id'],
    });

    res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    catchError(error, req, res, { function: 'deleteFolderFile' });
  }
};