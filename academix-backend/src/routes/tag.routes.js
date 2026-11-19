const router = require("express").Router();
const tagController = require("../controllers/tag.controller");

router.get("/getTagsByCourseId", tagController.getByCourseId);
router.post("/create", tagController.create);
router.put("/update", tagController.update);
router.delete("/delete", tagController.delete);
router.get("/tagsByTaskId", tagController.getTagsByTaskId);
module.exports = router;
