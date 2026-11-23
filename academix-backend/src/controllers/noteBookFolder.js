const {
  NoteBookFolder,
  NoteBookNote,
  User,
  TeamCourseBatch,
  TeamMember,
} = require("../../models");

const { Op } = require("sequelize"); // אם עוד לא מיובא
const { catchError } = require("../utils/errorHandler");

exports.getFolders = async (req, res) => {
  try {
    const { teamId, courseBatchId, team_member_id } = req.query;

    if (!teamId && !courseBatchId) {
      return res.status(400).json({
        success: false,
        message: "יש לספק teamId או courseBatchId כדי לזהות את ה- team_course_batch_id",
      });
    }

    // ===== שלב 1: איתור ה- team_course_batch_id מתוך הטבלה =====
    const tcbWhere = {};
    if (teamId) tcbWhere.team_id = teamId;
    if (courseBatchId) tcbWhere.course_batch_id = courseBatchId;

    const teamCourseBatches = await TeamCourseBatch.findAll({
      where: tcbWhere,
      attributes: ["id"],
      order: [["id", "DESC"]],
    });

    if (!teamCourseBatches.length) {
      return res.status(404).json({
        success: false,
        message: "לא נמצא team_course_batch מתאים לשילוב שסופק",
      });
    }

    const teamCourseBatchIds = teamCourseBatches.map((t) => t.id);

    // ===== שלב 2: בניית התנאי =====
    const where = {
      team_course_batch_id:
        teamCourseBatchIds.length === 1
          ? teamCourseBatchIds[0]
          : { [Op.in]: teamCourseBatchIds },
    };

    if (team_member_id) {
      // אם יש team_member_id → מחזירים גם אישיות של אותו חבר + כלליות
      where[Op.or] = [
        { team_member_id: null },
        { team_member_id },
      ];
    } else {
      // אם אין team_member_id → מחזירים רק כלליות
      where.team_member_id = null;
    }

    const folders = await NoteBookFolder.findAll({
      where,
      include: [
        { model: TeamCourseBatch, as: "teamCourseBatch" },
        { model: TeamMember, as: "teamMember" },
        { model: User, as: "creator" },
      ],
      order: [["created_at", "DESC"]],
    });

    return res.json({ success: true, data: folders });
  } catch (error) {
    console.error(error);
    return catchError(error, req, res, { function: "noteBookFolder.getFolders" });
  }
};


exports.getNotesByFolder = async (req, res) => {
  try {
    const { folderId } = req.params;

  
    
    const folder = await NoteBookFolder.findByPk(folderId);
    if (!folder) {
      return res.status(404).json({
        success: false,
        message: "התיקייה לא נמצאה",
      });
    }

    // שולפים את כל הפתקים של התיקייה
    const notes = await NoteBookNote.findAll({
      where: { folder_id: folderId },
      include: [{ model: User, as: "creator" }],
      order: [["created_at", "ASC"]],
    });

    // console.log("notes",notes);
    
    // בונים עץ תגובות מה-parent_note_id
    const noteMap = {};
    notes.forEach((note) => {
      const noteObj = note.toJSON();
      noteObj.replies = [];
      noteMap[note.id] = noteObj;
    });

    const treeNotes = [];

    notes.forEach((note) => {
      if (note.parent_note_id && noteMap[note.parent_note_id]) {
        noteMap[note.parent_note_id].replies.push(noteMap[note.id]);
      } else {
        treeNotes.push(noteMap[note.id]);
      }
    });


    return res.json({ success: true, data: treeNotes });
  } catch (error) {
    console.error(error);
    return catchError(error, req, res, { function: "noteBookFolder.getNotesByFolder" });
  }
};
exports.deleteFolder = async (req, res) => {
  try {
    const { folderId } = req.params;

    const folder = await NoteBookFolder.findByPk(folderId);

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: "תיקייה לא נמצאה",
      });
    }

    await folder.destroy();

    return res.json({
      success: true,
      message: "התיקייה נמחקה",
    });
  } catch (error) {
    console.error(error);
    return catchError(error, req, res, { function: "noteBookFolder.deleteFolder" });
  }
};
exports.createFolder = async (req, res) => {
  try {
    const { name, teamId, courseBatchId, team_member_id, system_key } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "שם התיקייה הוא שדה חובה",
      });
    }

    if (!teamId || !courseBatchId) {
      return res.status(400).json({
        success: false,
        message: "יש לספק גם teamId וגם courseBatchId",
      });
    }

 
    const teamCourseBatch = await TeamCourseBatch.findOne({
      where: {
        team_id: teamId,
        course_batch_id: courseBatchId,
      },
      order: [["id", "DESC"]],
    });

    if (!teamCourseBatch) {
      return res.status(404).json({
        success: false,
        message: "לא נמצא team_course_batch מתאים לשילוב שסופק",
      });
    }

    const folder = await NoteBookFolder.create({
      name: name.trim(),
      team_course_batch_id: teamCourseBatch.id,
      team_member_id: team_member_id ?? null,
      system_key: system_key ?? null,
      created_by: req.user?.id || null,
    });

    return res.status(201).json({
      success: true,
      data: folder,
    });
  } catch (error) {
    console.error(error);
    return catchError(error, req, res, { function: "noteBookFolder.createFolder" });
  }
};