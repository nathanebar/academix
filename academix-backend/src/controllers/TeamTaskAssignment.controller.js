const { TeamTaskAssignment } = require('../../models');
const logger = require('../utils/logger');

exports.create = async (req, res) => {
  try {
    const teamTaskAssignment = await TeamTaskAssignment.create(req.body);

    logger.info('TeamTaskAssignment created', {
      teamTaskAssignmentId: teamTaskAssignment.id,
      teamId: teamTaskAssignment.team_id,
      taskId: teamTaskAssignment.task_id,
      userId: req.headers['x-user-id']
    });

    res.status(201).json(teamTaskAssignment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const teamTaskAssignments = await TeamTaskAssignment.findAll();
    res.status(200).json(teamTaskAssignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const teamTaskAssignment = await TeamTaskAssignment.findByPk(req.params.id);
    if (!teamTaskAssignment) {
      return res.status(404).json({ message: 'Team task assignment not found' });
    }
    res.status(200).json(teamTaskAssignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const teamTaskAssignment = await TeamTaskAssignment.findByPk(req.params.id);
    if (!teamTaskAssignment) {
      return res.status(404).json({ message: 'Team task assignment not found' });
    }

    logger.info('TeamTaskAssignment updated', {
      teamTaskAssignmentId: req.params.id,
      updatedFields: Object.keys(req.body),
      userId: req.headers['x-user-id']
    });

    await teamTaskAssignment.update(req.body);
    res.status(200).json(teamTaskAssignment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const teamTaskAssignment = await TeamTaskAssignment.findByPk(req.params.id);
    if (!teamTaskAssignment) {
      return res.status(404).json({ message: 'Team task assignment not found' });
    }

    logger.info('TeamTaskAssignment deleted', {
      teamTaskAssignmentId: req.params.id,
      teamId: teamTaskAssignment.team_id,
      taskId: teamTaskAssignment.task_id,
      userId: req.headers['x-user-id']
    });

    await teamTaskAssignment.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};