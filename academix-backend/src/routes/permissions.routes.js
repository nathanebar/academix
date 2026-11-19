const express = require("express");
const router = express.Router();
const { getPermissionsForUser } = require("../services/permissions.service");
const { System } = require('../../models'); 
const logger = require('../utils/logger');
const { catchError } = require('../utils/errorHandler');

router.get("/my/:userId", async (req, res) => {
  try {
    const userId = Number(req.params.userId) || 3
    const detailedAssignments = await getPermissionsForUser(userId);
    
    res.json(detailedAssignments);
  } catch (err) {
    catchError(err, req, res, { function: 'getMyPermissions', userId: req.params.userId });
  }
});

router.post("/system", async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "שם המערכת הוא שדה חובה" });
    }

    const newSystem = await System.create({ name: name.trim() });
    res.status(201).json(newSystem);
  } catch (err) {
    catchError(err, req, res, { function: 'createSystem' });
  }
});

module.exports = router;