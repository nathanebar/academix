const { CheckLists } = require("../../models");
const logger = require("../utils/logger");

async function createCheckList(taskId, todo, done) {
  try {
    const checkLists = await CheckLists.create({
      task_id: taskId,
      todo: todo,
    });
    return checkLists;
  } catch (error) {
    logger.error("checkLists.service.createCheckList failed", { originalError: error.message, stack: error.stack });
    return;
  }
}

async function getCheckListsByTaskId(taskId) {
  try {
    const checkListsRecord = await CheckLists.findAll({
      where: {
        task_id: taskId,
      },
    });
    return checkListsRecord;
  } catch (error) {
    logger.error("checkLists.service.getCheckListsByTaskId failed", { originalError: error.message, stack: error.stack });
  }
}

async function updateCheckList(taskId) {
  try {
    const checkListsRecord = await CheckLists.findAll({
      where: {
        task_id: taskId,
      },
    });
    return checkListsRecord;
  } catch (error) {
    logger.error("checkLists.service.updateCheckList failed", { originalError: error.message, stack: error.stack });
  }
}

async function deleteCheckList(id) {
  try {
    const checkListsRecord = await CheckLists.findByPk(id);
    if (!checkListsRecord) {
      return { error: "checkList not found" };
    }
    const deletedCheckList = CheckLists.destroy({ where: { id: id } });
    if (deletedCheckList < 1) {
      return { error: "error in deleting checkList" };
    }

    return deletedCheckList;
  } catch (error) {
    logger.error("checkLists.service.deleteCheckList failed", { originalError: error.message, stack: error.stack });
  }
}

module.exports = {
  createCheckList,
  getCheckListsByTaskId,
  updateCheckList,
  deleteCheckList,
};
