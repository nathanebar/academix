const { TeamCourseBatch } = require("../../models");
const { catchError } = require("../utils/errorHandler");

exports.getAll = async (req, res) => {
  const teamCourseBatch = await TeamCourseBatch.findAll();
  res.json(teamCourseBatch);
};
exports.getByTeamAndCourseBatchIds = async (req, res) => {
  const { teamId, courseBatchId } = req.params;

  try {
    const records = await TeamCourseBatch.findAll({
      where: {
        team_id: teamId,
        course_batch_id: courseBatchId,
      },
      attributes: ["blockFromDate", "blockToDate"],
    });
    if (!records || records.length === 0) {
      return res.status(404).json({
        error: `No records found for team_id=${teamId} & course_batch_id=${courseBatchId}`,
      });
    }
    return res.status(200).json({
      message: "records retrieved successfully",
      data: records,
    });
  } catch (err) {
    console.error("🔴 getByTeamAndCourseBatchIds error:", err);
    return res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
};
exports.resetDates = async (req, res) => {
  const { teamId, courseBatchId } = req.body; // dates are not needed for the reset

  try {
    const record = await TeamCourseBatch.findOne({
      where: { team_id: teamId, course_batch_id: courseBatchId },
    });

    if (!record) {
      return res.status(404).json({
        error: `No record found for team_id=${teamId} & course_batch_id=${courseBatchId}`,
      });
    }

    record.blockFromDate = null;
    record.blockToDate = null;
    await record.save();

    logger.info('TeamCourseBatch dates reset', {
      teamId: teamId,
      courseBatchId: courseBatchId,
      previousFromDate: previousFromDate,
      previousToDate: previousToDate,
      userId: req.headers['x-user-id']
    });

    return res.status(200).json({
      message: "Blocked period cleared",
      data: { teamId, courseBatchId },
    });
  } catch (err) {
    catchError(err, req, res, { function: "resetDates" });
    console.error("🔴 resetDates error:", err);
    return res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
};
exports.updateDates = async (req, res) => {
  const { teamId, courseBatchId, fromISO, toISO } = req.body; // ← now from body

  try {
    const record = await TeamCourseBatch.findOne({
      where: {
        team_id: teamId,
        course_batch_id: courseBatchId,
      },
    });

    if (!record) {
      return res.status(404).json({
        error: `No record found for team_id=${teamId} & course_batch_id=${courseBatchId}`,
      });
    }

    record.blockFromDate = fromISO;
    record.blockToDate = toISO;
    await record.save();

    logger.info('TeamCourseBatch dates updated', {
      teamId: teamId,
      courseBatchId: courseBatchId,
      previousFromDate: previousFromDate,
      previousToDate: previousToDate,
      newFromDate: fromISO,
      newToDate: toISO,
      userId: req.headers['x-user-id']
    });

    return res.status(200).json({
      message: "Blocked period updated successfully",
      data: {
        teamId,
        courseBatchId,
        blockFromDate: fromISO,
        blockToDate: toISO,
      },
    });
  } catch (err) {
    catchError(err, req, res, { function: "updateDates" });
    console.error("🔴 updateDates error:", err);
    return res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
};
exports.getByTeamAndBatch = async (req, res) => {
  const { teamId, batchId } = req.params;
  try {
    const record = await TeamCourseBatch.findOne({
      where: { team_id: teamId, course_batch_id: batchId },
      attributes: ["isBlockColorEnabled"],
    });
    if (!record) return res.status(404).json({ error: "Not found" });
    return res.status(200).json(record);
  } catch (error) {
    console.error("🔴 update BlockColor By Team error:", error);
    return res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};
exports.updateBlockColorByTeam = async (req, res) => {
  const { teamId, courseBatchId, isBlockColorDto } = req.body;
  try {
    const record = await TeamCourseBatch.findOne({
      where: {
        team_id: teamId,
        course_batch_id: courseBatchId,
      },
    });
    if (!record) {
      return res.status(404).json({
        error: `No record found for team_id=${teamId} & course_batch_id=${courseBatchId}`,
      });
    }

    record.isBlockColorEnabled = isBlockColorDto;
    await record.save();

    logger.info('TeamCourseBatch blockColor updated', {
      teamId: teamId,
      courseBatchId: courseBatchId,
      previousValue: previousValue,
      newValue: isBlockColorDto,
      userId: req.headers['x-user-id']
    });

    return res.status(200).json({
      message: "Updated Color Blocked successfully",
      data: {
        teamId,
        courseBatchId,
        isBlockColorDto,
      },
    });
  } catch (error) {
    catchError(err, req, res, { function: "updateBlockColorByTeam" });
    console.error("🔴 update BlockColor By Team error:", err);
    return res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
};
