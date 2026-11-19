// routes/taskAssignmentHoef.routes.js
"use strict";

const express = require("express");
const router = express.Router();
const hoefController = require("../controllers/taskAssignmentHoef.controller");



router.get(
  "/task-assignment/:taskAssignmentId",
  hoefController.getHoefsByTaskAssignment
);

// 📋 קבלת כל החופפים של משתמש
router.get(
  "/user/:teamMemberId",
  hoefController.getHoefsByUser
);

// 📊 קבלת חופפים עם סטטוס (פגי תוקף, קרובים, וכו')
router.get(
  "/user/:teamMemberId/status",
  hoefController.getHoefTasksWithStatus
);

// 📋 קבלת חופפים זמינים להוספה למשימה
router.get(
  "/task-assignment/:taskAssignmentId/available",
  hoefController.getAvailableHoefs
);

// ➕ שמירת/עדכון כל החופפים למשימה
router.post(
  "/:taskAssignmentId",
  hoefController.saveHoefsForTask
);

// ➕ הוספת חופף בודד
router.post(
  "/:taskAssignmentId/add",
  hoefController.addHoef
);

// ✏️ עדכון דדליין של חופף
router.patch(
  "/:id/deadline",
  hoefController.updateHoefDeadline
);

router.delete(
  "/:taskAssignmentId/remove",
  hoefController.removeHoefFromTask
);
router.get(
  "/team/:teamId/summary",
  hoefController.getAllHoefsByTeam
);

router.get(
  "/team/:teamId/tasks",
  hoefController.getAllTeamTasks
);


module.exports = router;