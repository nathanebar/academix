const express = require("express");
const router = express.Router();
const controller = require("../controllers/taskAssignment.controller");

router.get(
  "/getTaskAssignmentsByTaskGroupAndRole",
  controller.getTaskAssignmentsByTaskGroupAndRole
);
router.get("/getUserTaskAssignments", controller.getUserTaskAssignments);
router.get("/getTeamCompletedTasks", controller.getTeamCompletedTasks);
router.get("/getDuplicatedTasks", controller.getDuplicatedTasks);
router.get(
  "/exists",
  controller.checkTaskAssignmentExists
);
router.get(
  "/UserExists",
  controller.checkUserTaskAssignmentExists
);

router.get("/", controller.getAllTaskAssignments);
router.get("/:id", controller.getTaskAssignmentById);
router.get("/note/:taskAssignmentId", controller.getNoteForStudent);
router.post("/", controller.createTaskAssignment);
router.post("/:taskId/team/:teamId", controller.assignToTeam);
router.post("/:taskId/team_new/:teamId", controller.assignToTeamNew);
router.post("/:taskId/user_new/:userId", controller.assignToUserNew);
router.post("/:taskId/user/:userId", controller.assignToUser);
router.patch("/note/:taskAssignmentId", controller.updateNoteForStudent);
router.put("/:taskId/team/:teamId", controller.updateTaskAssignmentTeam);
router.put("/:id", controller.updateTaskAssignmentUser);
router.put("/occurrences/:id", controller.updateTaskAssignmentOccurrence);

router.delete(
  "/occurrences/:occurrenceId/team/:teamId",
  controller.deleteTaskAssignmentOccurrenceTeam
);

router.delete(
  "/taskId/:taskId/teamId/:teamId",
  controller.deleteTaskAssignmentTeam
);
router.delete(
  "/taskId/:taskId/teamId/:teamId/userId/:userId",
  controller.deleteTaskAssignmentByUserId
);
router.delete("/:id", controller.deleteTaskAssignment);
router.delete("/occurrence/:id", controller.deleteTaskAssignmentOccurrence);

router.get("/:date/assignedTeam/:teamId/:course_batch_id", controller.assignedTeamDay);
router.get("/:date/assignedUser/:userId/:course_batch_id", controller.assignedUserDay);



router.get(
  "/range/:startDate/:endDate/assignedTeam/:teamId/:course_batch_id",
  controller.assignedTeamDayRange
);
router.get(
  "/range/:startDate/:endDate/assignedUser/:userId/:teamId/:course_batch_id",
  controller.assignedUserDayRange
);

router.post(
  "/:taskId/:teamId/feedback-form",
  controller.getFeedbackFormsForTask
);
router.get(
  "/by-assignment/:taskAssignmentId",
  controller.getFeedbackByTaskAssignmentId
);

router.put(
  '/:id/complete',
  controller.markAsCompleted
);

router.put('/:id/cancel', controller.cancelSubmission); 


router.get(
  "/team/:teamId",
  controller.getTaskAssignmentsByTeam
);

module.exports = router;
