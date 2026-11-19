const { getCalendarTasks } = require("../services/calendar.service");
const logger = require('../utils/logger');
const { catchError } = require('../utils/errorHandler');

async function getCalendarTasksController(req, res) {
  try {
    const userId = req.user?.id || req.headers['x-user-id'] || 3;

    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({ error: "Missing start or end date" });
    }

    const tasks = await getCalendarTasks(userId, start, end);

    res.json(tasks);
  } catch (err) {
    catchError(err, req, res, { function: 'getCalendarTasksController' });
  }
}

module.exports = { getCalendarTasksController };