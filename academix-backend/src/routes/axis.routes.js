const router = require("express").Router();
const axisController = require("../controllers/axis.controller");

router.get("/getAllowedAxes", axisController.getAllowedAxes);
// router.get("/by-permission", axisController.getAxesByPermission);
router.get("/task-count/:teamId", axisController.getTaskCountByAxisId);
router.post("/:selectedCourseBatch", axisController.create);
router.get("/", axisController.getAll);
router.get("/:id", axisController.getById);
router.put("/:id", axisController.update);
router.delete("/:id", axisController.remove);

module.exports = router;
