
const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedback.controller')


router.post('/', feedbackController.createFeedback);
router.get('/:id', feedbackController.getFeedback);
router.put('/:id', feedbackController.updateFeedback);
router.put('/updateFeedbackComplete/:id', feedbackController.updateFeedbackComplete);
router.put('/updateFeedbackAnswerViewable/:id', feedbackController.updateFeedbackAnswerViewable);
router.delete('/:id', feedbackController.deleteFeedback);
router.get('/', feedbackController.getAllFeedbacks);
router.get('/getByCourseIdOrTeamId/:courseId/:courseBatchId', feedbackController.getAllFeedbacksWithDetailsByCourseIdOrTeamId);
router.get('/getFeedbacksByUserId/:teamMemberId', feedbackController.getFeedbacksByUserId);
router.get('/getAll/:courseId/:teamId', feedbackController.getFeedbacksQuestions);
router.get('/getOpenFeedback/bySemester', feedbackController.getOpenFeedbackBySemester);
router.get('/getOpenFeedback/byTeam', feedbackController.getOpenFeedbackByTeam);
router.put('/:id/toggle-active', feedbackController.toggleFeedbackActive); 
router.get('/getMissedFeedbacksByUserId/:teamMemberId', feedbackController.getMissedFeedbacks);
router.get("/feedback-status/:taskAssignmentId", feedbackController.getFeedbackStatus);
module.exports = router;
