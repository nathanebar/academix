const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

const validateUpdateDates = (req, res, next) => {
  const { teamId, courseBatchId, fromISO, toISO } = req.body;

  if (!teamId || !courseBatchId || !fromISO || !toISO) {
    return res.status(400).json({
      error:
        "teamId, courseBatchId, fromISO and toISO are required in the request body",
    });
  }

  if (!isoRegex.test(fromISO) || !isoRegex.test(toISO)) {
    return res.status(400).json({
      error: "Invalid date format – expected ISO 8601 strings (e.g. 2024-09-01T00:00:00Z)",
    });
  }

  next();
};

module.exports = { validateUpdateDates };