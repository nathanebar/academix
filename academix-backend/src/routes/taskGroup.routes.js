const express = require('express');
const router = express.Router();
const taskGroupController = require('../controllers/taskGroup.controller');

router.get('/getTaskGroupByAxisId/:axisId/:courseBatchId/:teamId',taskGroupController.getTaskGroupByAxisIdAndCourseBatch);
router.get('/getTaskGroupByAxisIdToCalendar/:axisId/:courseBatchId',taskGroupController.getTaskGroupByAxisIdAndCourseBatchToCalendar);
router.get('/', taskGroupController.getAll);
router.get('/:id', taskGroupController.getById);
router.post('/:selectedCourseBatch/:axisId', taskGroupController.create);
router.put('/:id', taskGroupController.update);
router.delete('/:id', taskGroupController.remove);

module.exports = router;