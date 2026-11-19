const express = require("express");
const router = express.Router();
const controller = require("../controllers/taskVisibilityOverride.controller");

router.post("/", controller.createVisibilityOverride);
router.get("/task/:taskId", controller.getVisibilityOverridesByTask);
router.get("/team/:teamId", controller.getVisibilityOverridesByTeam);
router.get("/:taskId/:teamId", controller.getVisibilityOverrideByTaskAndTeam);
router.put("/:taskId/:teamId", controller.updateVisibilityOverride);
router.delete("/:taskId/:teamId", controller.deleteVisibilityOverride);

module.exports = router;