// routes/teamEventAssignment.routes.js
const router = require("express").Router();
const teamEventAssignmentController = require("../controllers/teamEventAssignment.controller");

router.get("/:teamEventsIds", teamEventAssignmentController.getAll);
router.get("/:id", teamEventAssignmentController.getById);
router.post("/", teamEventAssignmentController.create);
router.put("/:id", teamEventAssignmentController.update);
router.delete("/:id", teamEventAssignmentController.remove);

module.exports = router;