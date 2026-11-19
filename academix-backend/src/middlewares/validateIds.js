const validateIds = (req, res, next) => {
  const { teamId, courseBatchId } = req.params;

  if (!teamId || !courseBatchId) {
    return res.status(400).json({ error: "teamId and courseBatchId are required" });
  }

  const teamNum = Number(teamId);
  const batchNum = Number(courseBatchId);

  if (Number.isNaN(teamNum) || Number.isNaN(batchNum)) {
    return res.status(400).json({ error: "teamId and courseBatchId must be numbers" });
  }

  req.params.teamId = teamNum;
  req.params.courseBatchId = batchNum;

  next();
};

module.exports = { validateIds };