const { CheckLists } = require("../../models");

async function createCheckList(taskId, todo, done) {
  try {
    const checkLists = await CheckLists.create({
      task_id: taskId,
      todo: todo,
    });
    return checkLists;
  } catch (error) {
    console.log(error);
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
    console.log(error);
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
    console.log(error);
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
    console.log(error);
  }
}

module.exports = {
  createCheckList,
  getCheckListsByTaskId,
  updateCheckList,
  deleteCheckList,
};
