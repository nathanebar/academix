const router = require('express').Router();
const queueController = require('../controllers/queue.controller');


router.get('/team/:teamId/:course_batch_id', queueController.assignedTeamQueueRange);
router.get('/team/:teamId/:course_batch_id/member/:memberId', queueController.assignedTeamQueueRangeByMember);
router.get("/team-queue/:teamId/:course_batch_id/:memberId/flat", queueController.getQueueTasksByMemberFlat);

module.exports = router;
