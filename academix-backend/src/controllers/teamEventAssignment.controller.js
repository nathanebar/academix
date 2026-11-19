// controllers/teamEventAssignment.controller.js
const { TeamEventAssignment, TeamEvent } = require("../../models");
const { Op } = require("sequelize");
exports.getAll = async (req, res) => {
  try {
    const { teamEventsIds } = req.params;

    // Parse teamEventsIds - could be a comma-separated string, JSON, or array
    let ids;
    if (typeof teamEventsIds === "string") {
      // If it's a comma-separated string like "1,2,3"
      ids = teamEventsIds.split(",").map((id) => parseInt(id.trim(), 10));
    } else if (Array.isArray(teamEventsIds)) {
      ids = teamEventsIds;
    } else {
      ids = [parseInt(teamEventsIds, 10)]; // Single value
    }

    const assignments = await TeamEventAssignment.findAll({
      where: {
        TeamEventId: { [Op.in]: ids }, // Returns rows where TeamEventId is IN the array
      },
      include: [{ model: TeamEvent, as: "teamEvent" }],
    });

    res.json(assignments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch assignments" });
  }
};

exports.getById = async (req, res) => {
  try {
    const assignment = await TeamEventAssignment.findByPk(req.params.id, {
      include: [{ model: TeamEvent, as: "teamEvent" }],
    });
    if (!assignment)
      return res.status(404).json({ error: "TeamEventAssignment not found" });
    res.json(assignment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch assignment" });
  }
};

exports.create = async (req, res) => {
  try {
    const assignment = await TeamEventAssignment.create(req.body);
    res.status(201).json(assignment);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Failed to create assignment" });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await TeamEventAssignment.findByPk(id);
    if (!assignment)
      return res.status(404).json({ error: "TeamEventAssignment not found" });

    const updateData = {};

    if (req.body.TeamEventId !== undefined) {
      updateData.TeamEventId = req.body.TeamEventId;
    }
    if (req.body.start !== undefined) {
      updateData.start = req.body.start;
    }
    if (req.body.end !== undefined) {
      updateData.end = req.body.end;
    }
    if (req.body.note !== undefined) {
        updateData.note = req.body.note;
      }
    await assignment.update(updateData);
    res.json(assignment);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Failed to update assignment" });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await TeamEventAssignment.findByPk(id);
    if (!assignment)
      return res.status(404).json({ error: "TeamEventAssignment not found" });

    await assignment.destroy({ force: true });
    res.status(200).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete assignment" });
  }
};
