// controllers/teamEvent.controller.js
const { Op } = require("sequelize");
const { TeamEvent, TeamEventAssignment, TeamCourseBatch, TeamEventDay, Sequelize } = require("../../models");
const logger = require("../utils/logger");

exports.getAllByTeamId = async (req, res) => {
    try {
        const { team_id, course_batch_id } = req.params;
        const teamEvents = await TeamEvent.findAll({
            include: [
                {
                    model: TeamCourseBatch,
                    as: 'teamCourseBatch',
                    attributes: ['team_id', 'course_batch_id'],
                },
                {
                    model: TeamEventDay,
                    as: "days",
                    attributes: ["dayNum"],
                }
            ]
        });


        const filterTeamEvents = teamEvents.filter(
            (teamEvent) => teamEvent.dataValues.teamCourseBatch.team_id === parseInt(team_id)
        );

        res.json(filterTeamEvents);
    } catch (err) {
        logger.error("teamEvent.getAllByTeamId failed", { originalError: err.message, stack: err.stack });
        res.status(500).json({ error: "Failed to fetch team events" });
    }
};

exports.getById = async (req, res) => {
    try {
        const teamEvent = await TeamEvent.findByPk(req.params.id, {
            include: [
                { model: TeamEventAssignment, as: "teamEventAssignments" },
                { model: TeamEventDay, as: "days" }
            ],
        });
        if (!teamEvent)
            return res.status(404).json({ error: "TeamEvent not found" });
        res.json(teamEvent);
    } catch (err) {
        logger.error("teamEvent.getById failed", { originalError: err.message, stack: err.stack });
        res.status(500).json({ error: "Failed to fetch team event" });
    }
};

exports.create = async (req, res) => {
    try {
        const { teamId, courseBatchId, days, ...data } = req.body;

        const TeamCourseBatchByteam_id = await TeamCourseBatch.findOne({
            where: { team_id: teamId, course_batch_id: courseBatchId }
        });

        const teamEvent = await TeamEvent.create({
            ...data,
            teamCourseBatchId: TeamCourseBatchByteam_id.id
        });

        // יצירת הימים אם נשלחו
        if (days && Array.isArray(days) && days.length > 0) {
            const daysData = days.map((dayNum) => ({
                teamEventId: teamEvent.id,
                dayNum: dayNum
            }));
            await TeamEventDay.bulkCreate(daysData);
        }

        // החזרת האירוע עם הימים
        const teamEventWithDays = await TeamEvent.findByPk(teamEvent.id, {
            include: [{ model: TeamEventDay, as: "days" }]
        });

        res.status(201).json(teamEventWithDays);
    } catch (err) {
        logger.error("teamEvent.create failed", { originalError: err.message, stack: err.stack });
        res.status(400).json({ error: "Failed to create team event" });
    }
};

exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const teamEvent = await TeamEvent.findByPk(id);
        if (!teamEvent)
            return res.status(404).json({ error: "TeamEvent not found" });

        const teamEventAssignments = await TeamEventAssignment.findAll({
            where: {
                TeamEventId: id,
                start: { [Op.gt]: new Date() }
            }
        })


        await teamEvent.update(req.body.teamEvent);
        // עדכון הימים אם נשלחו
        const deleted = await TeamEventAssignment.destroy({
            where: {
                TeamEventId: id,
                start: { [Op.gte]: new Date() }
            }
        });



        // מחיקת כל הימים הקיימים
        await TeamEventDay.destroy({ where: { teamEventId: id } });

        // הוספת הימים החדשים
        if (Array.isArray(req.body.teamEvent.days) && req.body.teamEvent.days.length > 0) {
            const daysData = req.body.teamEvent.days.map((dayNum) => ({
                teamEventId: id,
                dayNum: dayNum
            }));
            await TeamEventDay.bulkCreate(daysData);
        }


        // החזרת האירוע עם הימים המעודכנים
        const teamEventWithDays = await TeamEvent.findByPk(id, {
            include: [{ model: TeamEventDay, as: "days" }]
        });

        res.json(teamEventWithDays);
    } catch (err) {
        logger.error("teamEvent.update failed", { originalError: err.message, stack: err.stack });
        res.status(400).json({ error: "Failed to update team event" });
    }
};

exports.remove = async (req, res) => {
    try {
        const { id } = req.params;
        const teamEvent = await TeamEvent.findByPk(id);
        if (!teamEvent)
            return res.status(404).json({ error: "TeamEvent not found" });

        // Sequelize ימחק את הימים בגלל CASCADE
        // אבל נמחק קודם את ה-assignments


        await teamEvent.destroy({ force: true });
        res.status(200).send();
    } catch (err) {
        logger.error("teamEvent.remove failed", { originalError: err.message, stack: err.stack });
        res.status(500).json({ error: "Failed to delete team event" });
    }
};

// bonus: שאילתה לפי יום
exports.getByDay = async (req, res) => {
    try {
        const { team_id, course_batch_id, day_num } = req.params;

        const teamCourseBatch = await TeamCourseBatch.findOne({
            where: { team_id, course_batch_id }
        });

        if (!teamCourseBatch) {
            return res.status(404).json({ error: "TeamCourseBatch not found" });
        }

        const teamEvents = await TeamEvent.findAll({
            where: { teamCourseBatchId: teamCourseBatch.id },
            include: [
                { model: TeamEventDay, as: "days" },
                { model: TeamEventAssignment, as: "teamEventAssignments" }
            ]
        });

        // סינון לפי יום
        const todayEvents = teamEvents.filter((event) =>
            event.days.some((day) => day.dayNum === parseInt(day_num))
        );

        res.json(todayEvents);
    } catch (err) {
        logger.error("teamEvent.getByDay failed", { originalError: err.message, stack: err.stack });
        res.status(500).json({ error: "Failed to fetch events by day" });
    }
};