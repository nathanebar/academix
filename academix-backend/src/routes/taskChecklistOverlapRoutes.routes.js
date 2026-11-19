const express = require("express");
const router = express.Router();
const taskChecklistOverlapController = require("../controllers/taskChecklistOverlap.controller");

router.get("/by-task/:taskId", taskChecklistOverlapController.getByTaskId);
router.post("/", taskChecklistOverlapController.createOrUpdate);


module.exports = router;