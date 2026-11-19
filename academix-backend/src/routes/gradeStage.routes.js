const router = require("express").Router();
const gradeStageController = require("../controllers/gradeStage.controller");

router.get("/getGradeStagesByCourseId", gradeStageController.getByCourseId);
router.get("/task-count", gradeStageController.getCountByTeamsIds);
router.post("/create", gradeStageController.create);
router.put("/update", gradeStageController.update);
router.delete("/delete", gradeStageController.delete);

module.exports = router;
