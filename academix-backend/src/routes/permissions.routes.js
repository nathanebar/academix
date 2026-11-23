const express = require("express");
const router = express.Router();
const { getPermissionsForUser } = require("../services/permissions.service");
const { System } = require('../../models'); 
const logger = require('../utils/logger');
const { catchError } = require('../utils/errorHandler');

// Permissions of the authenticated user (#13).
router.get("/my", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "unauthenticated" });
  try {
    res.json(await getPermissionsForUser(req.user.id));
  } catch (err) {
    catchError(err, req, res, { function: 'getMyPermissions', userId: req.user.id });
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