const {
  getCheckListsByTaskId,
  createCheckList,
  updateCheckList,
  deleteCheckList,
} = require("../services/checkLists.service");
const { CheckLists } = require("../../models");
const logger = require("../utils/logger");


module.exports = {
  async getByTaskId(req, res) {
    const {
      //  userId,
      taskid,
    } = req.headers;
    try {
      const checkLists = await getCheckListsByTaskId(taskid);
      res.status(200).json(checkLists);
    } catch (error) {
      console.log(error);
      res.status(500).json(`An Error Occured ${error}`);
    }
  },

  async create(req, res) {
    const { taskid, todo } = req.body;
    try {
      const savedCheckList = await createCheckList(taskid, todo);
      logger.info('CheckList created', {
        checkListId: savedCheckList.id,
        taskId: taskid,
        todo,
        userId: req.headers['x-user-id']
      });
      res.status(200).json(savedCheckList);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async update(req, res) {
    const { checkList, taskId } = req.body;
    try {
      const checkListsOfTask = await getCheckListsByTaskId(Number(taskId));
      if (checkListsOfTask && checkListsOfTask?.length > 0) {
        for (const cl of checkListsOfTask) {
          try {
            await deleteCheckList(cl?.id);
            logger.info('CheckList deleted (as part of update)', {
              checkListId: cl?.id,
              taskId: Number(taskId),
              userId: req.headers['x-user-id']
            });
          } catch (error) {
            console.log(error);
            res.status(400).json({ error });
          }
        }
      }
      if (checkList && checkList?.length > 0) {
        for (const cl of checkList) {
          try {
            await createCheckList(Number(taskId), cl?.toDo);
            logger.info('CheckList created (as part of update)', {
              checkListId: newCheckList.id,
              taskId: Number(taskId),
              todo: cl?.toDo,
              userId: req.headers['x-user-id']
            });
          } catch (error) {
            console.log(error);
            res.status(400).json({ error });
          }
        }
      }
      logger.info('CheckLists updated successfully', {
        taskId: Number(taskId),
        userId: req.headers['x-user-id']
      });
      return res.status(200).json({ updated: true });
    } catch (err) {
      console.log(err);

      res.status(400).json({ error: err.message });
    }
  },

  async delete(req, res) {
    try {
      res.status(200).json({ message: "Course deleted" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};
