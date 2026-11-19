const express = require("express");
const router = express.Router();
const taskController = require("../controllers/task.controller");

router.get("/", taskController.getAll);
router.get("/getById/:id", taskController.getById);
router.get("/getTaskByGroupIdAndTeam", taskController.getTasksByTaskGroupId);
router.get("/getTasksByTeamIds", taskController.getTasksByTeamIds);
router.get(
  "/getTaskByGroupIdAndUser",
  taskController.getTasksByTaskGroupIdAndUser
);
router.get(
  "/getTasksWithFeedbackByTeamId/:teamId/:courseBatchId",
  taskController.getTasksWithFeedbackByTeamId
);
router.get(
  "/getUsersAssignedToTask/:taskId",
  taskController.getUsersAssignedToTask
);
router.get("/getTasksByUser", taskController.getTasksByUser);
router.get("/getTasksBySemester", taskController.getTasksBySemester);
router.get("/getTasksByTeam", taskController.getTasksByTeam);
router.get("/getGradeStageProgress", taskController.getGradeStageProgress);
router.get(
  "/getGradeStageProgressByTeam",
  taskController.getGradeStageProgressByTeam
);

router.post("/:selectedCourseBatch", taskController.create);
router.put("/:id", taskController.update);
router.put("/confirmTask/:id", taskController.confirmTask);
router.delete("/:id", taskController.remove);
router.post("/duplicate/:id", taskController.duplicate);

// TAGS
router.delete("/:taskId/tags", taskController.deleteAllTaskTags);
router.post("/:taskId/tags", taskController.addTagsToTask);
router.get("/:taskId/tags", taskController.getTaskTags);
router.get("/getTasksByTagIdAndTeam", taskController.getTasksByTagIdsTeam);
router.get("/getTasksByTagIdAndUser", taskController.getTasksByTagIdsUser);

// BY COLOR
router.get("/getTasksByColorAndTeam", taskController.getTasksByColorTeam);
router.get("/getTasksByColorAndUser", taskController.getTasksByColorUser);

// BY GRADE STAGE
router.get(
  "/getTasksByGradeStageIdTeam",
  taskController.getTasksByGradeStageIdTeam
);
router.get(
  "/getTasksByGradeStageIdUser",
  taskController.getTasksByGradeStageIdUser
);

// router.get("/search", taskController.getTasksBySearch);
router.get("/advanced-search", taskController.advancedSearch);
router.get("/filter-options", taskController.getFilterOptions);

module.exports = router;
