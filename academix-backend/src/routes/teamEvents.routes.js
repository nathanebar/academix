// routes/teamEvent.routes.js
const router = require("express").Router();
const teamEventController = require("../controllers/teamEvent.conroller");

router.get("/:team_id/:course_batch_id", teamEventController.getAllByTeamId);

router.post("/", teamEventController.create);
router.put("/:id", teamEventController.update);
router.delete("/:id", teamEventController.remove);

module.exports = router;