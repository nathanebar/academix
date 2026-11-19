const { TaskChecklistOverlap } = require("../../models");
const { sequelize } = require("../../models/index");
const logger = require('../utils/logger');
const { catchError } = require('../utils/errorHandler');

exports.getByTaskId = async (req, res) => {
  try {
    const { taskId } = req.params;

    const checklists = await TaskChecklistOverlap.findAll({
      where: { task_id: taskId },
      order: [["order_index", "ASC"]],
    });

    res.json(checklists);
  } catch (error) {
    catchError(error, req, res);
  }
};

// ════════════════════════════════════════════
// יצירה/עדכון צ'ק ליסטים
// POST /api/task-checklist-overlap
// ════════════════════════════════════════════
exports.createOrUpdate = async (req, res) => {
  const { taskId, checklists } = req.body;
  const transaction = await sequelize.transaction();

  try {
    // מחיקת כל הצ'ק ליסטים הקיימים
    await TaskChecklistOverlap.destroy({
      where: { task_id: taskId },
      transaction,
    });

    // הכנסת החדשים
    if (checklists && checklists.length > 0) {
      const checklistsToCreate = checklists.map((item, index) => ({
        task_id: taskId,
        todo: item.todo,
        order_index: index,
      }));

      await TaskChecklistOverlap.bulkCreate(checklistsToCreate, {
        transaction,
      });
    }

    await transaction.commit();

    // שליפה מחדש אחרי השמירה
    const savedChecklists = await TaskChecklistOverlap.findAll({
      where: { task_id: taskId },
      order: [["order_index", "ASC"]],
    });

    logger.info('TaskChecklistOverlap created/updated', {
      taskId: taskId,
      checklistsCount: checklists?.length || 0,
      savedCount: savedChecklists.length,
      userId: req.headers['x-user-id']
    });
    
    res.status(201).json({
      msg: "הצ'ק ליסטים נשמרו בהצלחה!",
      checklists: savedChecklists,
    });
  } catch (error) {
    await transaction.rollback();
    catchError(error, req, res);
  }
};

