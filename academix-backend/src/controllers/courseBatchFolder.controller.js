const courseBatchFolderService = require("../services/courseBatchFolder.service");
const logger = require("../utils/logger");
const { catchError } = require("../utils/errorHandler");

exports.createFolder = async (req, res) => {
  try {
    const {
      course_batch_id,
      name,
      color,
      repository_kind,
      team_id,
      team_member_id,
    } = req.body;
    if (!course_batch_id || !name) {
      return res
        .status(400)
        .json({ message: "course_batch_id and name are required" });
    }

    const created_by = req.headers["x-user-id"]
      ? Number(req.headers["x-user-id"])
      : null;

    const folder = await courseBatchFolderService.createFolder({
      course_batch_id: Number(course_batch_id),
      name,
      color: color || "gray",
      repository_kind: repository_kind || "operational",
      team_id: team_id ? Number(team_id) : null,
      team_member_id: team_member_id ? Number(team_member_id) : null,
      created_by,
    });

    logger.info("Course batch folder created", {
      folderId: folder.id,
      name,
      courseBatchId: course_batch_id,
      userId: created_by,
    });

    res.status(201).json(folder);
  } catch (error) {
    catchError(error, req, res, { function: "createFolder" });
  }
};

exports.getFolders = async (req, res) => {
  try {
    const { coursebatchid, teammemberid } = req.headers;
    const { team_id } = req.query;

    if (!coursebatchid) {
      return res.status(400).json({ message: "Missing header: coursebatchid" });
    }

    const folders = await courseBatchFolderService.getFoldersByCourseBatchId(
      Number(coursebatchid),
      team_id ? Number(team_id) : null,
      teammemberid ? Number(teammemberid) : null // 🔽 הוסף
    );

    res.status(200).json(folders);
  } catch (error) {
    catchError(error, req, res, { function: "getFolders" });
  }
};

exports.updateFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color, repository_kind } = req.body;

    const folder = await courseBatchFolderService.updateFolder(Number(id), {
      name,
      color,
      repository_kind,
    });

    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    logger.info("Course batch folder updated", {
      folderId: id,
      userId: req.headers["x-user-id"],
    });

    res.status(200).json(folder);
  } catch (error) {
    catchError(error, req, res, { function: "updateFolder", folderId: id });
  }
};

exports.deleteFolder = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await courseBatchFolderService.deleteFolder(Number(id));

    if (!deleted) {
      return res.status(404).json({ message: "Folder not found" });
    }

    logger.info("Course batch folder deleted", {
      folderId: id,
      userId: req.headers["x-user-id"],
    });

    res.status(200).json({ message: "Folder deleted successfully" });
  } catch (error) {
    catchError(error, req, res, { function: "deleteFolder", folderId: id });
  }
};

exports.getFolderById = async (req, res) => {
  try {
    const { id } = req.params;

    const folder = await courseBatchFolderService.getFolderById(Number(id));

    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    res.status(200).json(folder);
  } catch (error) {
    catchError(error, req, res, { function: "getFolderById", folderId: id });
  }
};
