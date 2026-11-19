const express = require("express");
const router = express.Router();
const controller = require("../controllers/assignmentProgress.controller");




router.post("/create", controller.createAssignmentProgress);
router.get("/getByAssId", controller.getMissionCompleted);
router.put("/updateMissionCompleted/:id", controller.updateMissionCompleted);
router.put("/removeMissionCompleted/:id", controller.removeMissionCompleted);
router.put("/updateTaskAssignmentCompleted/:id", controller.updateTaskAssignmentCompleted);
router.put("/TaskAssignmentsCompletedByCommander/:id", controller.TaskAssignmentsCompletedByCommander);
router.put("/AllTaskAssignmentsCompletedByCommander/:id", controller.AllTaskAssignmentsCompletedByCommander);
router.get("/GetAssignmentsCompletedByUser", controller.GetAssignmentsCompletedByUser);
router.get("/GetAssignmentsCompletedByTeam", controller.GetAssignmentsCompletedByTeam);

module.exports = router;
