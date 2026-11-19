
const express = require("express");
const router = express.Router();
const NotebookNoteController = require("../controllers/NotebookNote");

router.post("/", NotebookNoteController.createNote);
router.put("/:noteId", NotebookNoteController.updateNote);
router.delete("/:noteId", NotebookNoteController.deleteNote);

module.exports = router;