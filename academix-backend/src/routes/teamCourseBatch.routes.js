const router = require("express").Router();
const teamCourseBatchController = require("../controllers/teamCourseBatch.controller");
const { validateUpdateDates } = require("../middlewares/validateUpdateDates");
const { validateIds } = require("../middlewares/validateIds");
router.get("/", teamCourseBatchController.getAll);
router.get(
  "/getByTeamAndCourseBatchIds/:teamId/:courseBatchId",
  validateIds,
  teamCourseBatchController.getByTeamAndCourseBatchIds
);
router.put(
  "/updateDate",
  validateUpdateDates,
  teamCourseBatchController.updateDates
);
router.delete(
  "/removeDates",
  teamCourseBatchController.resetDates 
);
router.get("/byTeam/:teamId/batch/:batchId", teamCourseBatchController.getByTeamAndBatch);
router.put(
  "/updateBlockColorByTeam",
  teamCourseBatchController.updateBlockColorByTeam
);
module.exports = router;
