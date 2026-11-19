const router = require("express").Router();
const checklistsController = require("../controllers/checkLists.controller");

router.get("/getCheckListsByTaskId", checklistsController.getByTaskId);
router.post("/create", checklistsController.create);
router.put("/update", checklistsController.update);
router.delete("/delete", checklistsController.delete);

module.exports = router;
