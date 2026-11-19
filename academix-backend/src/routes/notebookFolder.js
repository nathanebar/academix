const express = require("express");
const router = express.Router();
const notebookController = require("../controllers/noteBookFolder");


router.get("/folders", notebookController.getFolders);


router.get("/folders/:folderId/notes", notebookController.getNotesByFolder);
router.delete("/folders/:folderId", notebookController.deleteFolder);
router.post("/folders", notebookController.createFolder);

module.exports = router;