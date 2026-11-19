const { TaskVisibilityOverride, Task, Team, User } = require("../../models");
const { Op } = require("sequelize");
const logger = require('../utils/logger');

exports.createVisibilityOverride = async (req, res) => {
    try {
        const { taskId, teamId, startMinutesBefore, endMinutesAfter } = req.body;
        const userId = req.user?.id;

        if (!taskId || !teamId) {
            return res.status(400).json({
                error: "חסרים פרמטרים חובה"
            });
        }

        const startMinutes = parseInt(startMinutesBefore) || 0;
        const endMinutes = parseInt(endMinutesAfter) || 0;

        if (startMinutes < 0 || endMinutes < 0) {
            return res.status(400).json({
                error: "הערכים חייבים להיות חיוביים"
            });
        }

        const task = await Task.findByPk(taskId);
        if (!task) {
            return res.status(404).json({ error: "המשימה לא נמצאה" });
        }

        const team = await Team.findByPk(teamId);
        if (!team) {
            return res.status(404).json({ error: "הצוות לא נמצא" });
        }

        let visibilityOverride = await TaskVisibilityOverride.findOne({
            where: {
                task_id: taskId,
                team_id: teamId
            }
        });

        let created = false;

        if (visibilityOverride) {
            visibilityOverride.start_minutes_before = startMinutes;
            visibilityOverride.end_minutes_after = endMinutes;
            await visibilityOverride.save();
        } else {
            visibilityOverride = await TaskVisibilityOverride.create({
                task_id: taskId,
                team_id: teamId,
                start_minutes_before: startMinutes,
                end_minutes_after: endMinutes,
                ...(userId && { created_by: userId })
            });
            created = true;
        }

        logger.info('TaskVisibilityOverride created/updated', {
            taskId: taskId,
            teamId: teamId,
            created: created,
            visibilityOverrideId: visibilityOverride.id,
            startMinutesBefore: startMinutes,
            endMinutesAfter: endMinutes,
            userId: req.headers['x-user-id']
        });

        res.status(created ? 201 : 200).json({
            success: true,
            message: created
                ? "הגדרת החשיפה נוצרה בהצלחה"
                : "הגדרת החשיפה עודכנה בהצלחה",
            data: visibilityOverride
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getVisibilityOverridesByTask = async (req, res) => {
    try {
        const { taskId } = req.params;

        const overrides = await TaskVisibilityOverride.findAll({
            where: { task_id: taskId },
            include: [
                { model: Team, attributes: ['id', 'name'] },
                { model: User, as: 'creator', attributes: ['id', 'name', 'username'] }
            ]
        });

        res.json({
            success: true,
            data: overrides
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.getVisibilityOverridesByTeam = async (req, res) => {
    try {
        const { teamId } = req.params;

        const overrides = await TaskVisibilityOverride.findAll({
            where: { team_id: teamId },
            include: [
                { model: Task, attributes: ['id', 'name'] },
                { model: User, as: 'creator', attributes: ['id', 'name', 'username'] }
            ]
        });

        res.json({
            success: true,
            data: overrides
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getVisibilityOverrideByTaskAndTeam = async (req, res) => {
    try {
        const { taskId, teamId } = req.params;

        const override = await TaskVisibilityOverride.findOne({
            where: {
                task_id: taskId,
                team_id: teamId
            },
            include: [
                { model: Task, attributes: ['id', 'name'] },
                { model: Team, attributes: ['id', 'name'] },
                { model: User, as: 'creator', attributes: ['id', 'name', 'username'] }
            ]
        });

        res.json({
            success: true,
            data: override
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteVisibilityOverride = async (req, res) => {
    try {
        const { taskId, teamId } = req.params;

        const deleted = await TaskVisibilityOverride.destroy({
            where: {
                task_id: taskId,
                team_id: teamId
            }
        });

        if (!deleted) {
            return res.status(404).json({ error: "ההגדרה לא נמצאה" });
        }

        logger.info('TaskVisibilityOverride deleted', {
            taskId: taskId,
            teamId: teamId,
            userId: req.headers['x-user-id']
        });

        res.json({
            success: true,
            message: "הגדרת החשיפה נמחקה בהצלחה"
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateVisibilityOverride = async (req, res) => {
    try {
        const { taskId, teamId } = req.params;
        const { startMinutesBefore, endMinutesAfter } = req.body;

        const startMinutes = parseInt(startMinutesBefore) || 0;
        const endMinutes = parseInt(endMinutesAfter) || 0;

        if (startMinutes < 0 || endMinutes < 0) {
            return res.status(400).json({
                error: "הערכים חייבים להיות חיוביים"
            });
        }

        const [updated] = await TaskVisibilityOverride.update(
            {
                start_minutes_before: startMinutes,
                end_minutes_after: endMinutes
            },
            {
                where: {
                    task_id: taskId,
                    team_id: teamId
                }
            }
        );

        if (!updated) {
            return res.status(404).json({ error: "ההגדרה לא נמצאה" });
        }

        const updatedOverride = await TaskVisibilityOverride.findOne({
            where: {
                task_id: taskId,
                team_id: teamId
            }
        });

        logger.info('TaskVisibilityOverride updated', {
            taskId: taskId,
            teamId: teamId,
            visibilityOverrideId: updatedOverride?.id,
            startMinutesBefore: startMinutes,
            endMinutesAfter: endMinutes,
            userId: req.headers['x-user-id']
        });

        res.json({
            success: true,
            message: "הגדרת החשיפה עודכנה בהצלחה",
            data: updatedOverride
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};