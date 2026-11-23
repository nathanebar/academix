// routes/teamEventAssignment.routes.js
const router = require("express").Router();
const teamEventAssignmentController = require("../controllers/teamEventAssignment.controller");

// One or several ids, comma-separated ("/12" or "/12,13"). There is no separate GET /:id:
// it was declared after this route, so it was never reached (and the frontend doesn't use it).
router.get("/:teamEventsIds", teamEventAssignmentController.getAll);
router.post("/", teamEventAssignmentController.create);
router.put("/:id", teamEventAssignmentController.update);
router.delete("/:id", teamEventAssignmentController.remove);

module.exports = router;