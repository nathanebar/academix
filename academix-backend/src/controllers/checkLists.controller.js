const {
  getCheckListsByTaskId,
  createCheckList,
  updateCheckList,
  deleteCheckList,
} = require("../services/checkLists.service");
const { CheckLists } = require("../../models");
const logger = require("../utils/logger");
const { catchError } = require("../utils/errorHandler");


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
      catchError(error, req, res, { function: "checkLists.getByTaskId" });
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
      catchError(err, req, res, { function: "checkLists.create", status: 400 });
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
            // Was res.status(400).json({ error }) inside the loop: the raw error object went to the
            // client and the loop kept going, so a second response was sent (ERR_HTTP_HEADERS_SENT).
            throw error;
          }
        }
      }
      if (checkList && checkList?.length > 0) {
        for (const cl of checkList) {
          try {
            const newCheckList = await createCheckList(Number(taskId), cl?.toDo);
            logger.info('CheckList created (as part of update)', {
              checkListId: newCheckList?.id,
              taskId: Number(taskId),
              todo: cl?.toDo,
              userId: req.headers['x-user-id']
            });
          } catch (error) {
            // Was res.status(400).json({ error }) inside the loop: the raw error object went to the
            // client and the loop kept going, so a second response was sent (ERR_HTTP_HEADERS_SENT).
            throw error;
          }
        }
      }
      logger.info('CheckLists updated successfully', {
        taskId: Number(taskId),
        userId: req.headers['x-user-id']
      });
      return res.status(200).json({ updated: true });
    } catch (err) {

      catchError(err, req, res, { function: "checkLists.update", status: 400 });
    }
  },

  async delete(req, res) {
    try {
      res.status(200).json({ message: "Course deleted" });
    } catch (err) {
      catchError(err, req, res, { function: "checkLists.delete" });
    }
  },
};
