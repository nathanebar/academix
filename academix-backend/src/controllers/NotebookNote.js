
const { NoteBookNote, NoteBookFolder, TeamCourseBatch } = require("../../models");
const { catchError } = require("../utils/errorHandler");

exports.updateNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const { title, content } = req.body;

  
    
    const note = await NoteBookNote.findByPk(noteId);

  
    
    if (!note) {
      return res.status(404).json({ success: false, message: "פתק לא נמצא" });
    }

    await note.update({
      title: title ?? note.title,
      // content נשמר כ-JSONB — עובר ישירות (Delta של Quill)
      content: content === undefined ? note.content : content,
    });

    return res.json({ success: true, data: note });
  } catch (error) {
    console.error(error);
    return catchError(error, req, res, { function: "NotebookNote.updateNote" });
  }
};

exports.createNote = async (req, res) => {
  try {
    const { folder_id, title, content, parent_note_id ,created_by} = req.body;

    console.log(req?.created_by);
    
    if (!folder_id) {
      return res.status(400).json({
        success: false,
        message: "נדרש folder_id",
      });
    }

    const folder = await NoteBookFolder.findByPk(folder_id);
    if (!folder) {
      return res.status(404).json({
        success: false,
        message: "תיקייה לא נמצאה",
      });
    }

    const note = await NoteBookNote.create({
      folder_id,
      title: title || "ללא כותרת",
      content: content ?? null,
      parent_note_id: parent_note_id ?? null,
      created_by: created_by || null, 
    });

    return res.status(201).json({
      success: true,
      data: note,
    });
  } catch (error) {
    console.error(error);
    return catchError(error, req, res, { function: "NotebookNote.createNote" });
  }
};
exports.deleteNote = async (req, res) => {
  try {
    const { noteId } = req.params;

    const note = await NoteBookNote.findByPk(noteId);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "פתק לא נמצא",
      });
    }


    await note.destroy();

    return res.json({
      success: true,
      message: "הפתק נמחק",
    });
  } catch (error) {
    console.error(error);
    return catchError(error, req, res, { function: "NotebookNote.deleteNote" });
  }
};