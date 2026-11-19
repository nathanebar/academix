const express = require("express");
const router = express.Router();
const { System, Domain, Course, RoleAssignment } = require('../../models');
const { Op } = require("sequelize");
const logger = require('../utils/logger');
const { catchError } = require('../utils/errorHandler');

router.get("/", async (req, res) => {
  try {
    const systems = await System.findAll({
      order: [['id', 'ASC']]
    });

    const systemsWithCounts = await Promise.all(systems.map(async (system) => {
      const domains = await Domain.findAll({ where: { systemId: system.id } });
      const domainIds = domains.map(d => d.id);

      const courses = domainIds.length > 0
        ? await Course.findAll({ where: { domainId: domainIds } })
        : [];

      return {
        scope_id: system.id,
        scopeName: system.name,
        allowedDomainIds: domainIds,
        allowedCourseIds: courses.map(c => c.id),
        allowedTeamIds: [],
      };
    }));

    res.json(systemsWithCounts);
  } catch (err) {
    catchError(err, req, res);
  }
});

router.post("/", async (req, res) => {
  const { name, adminUsername } = req.body;

  try {
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "שם המערכת הוא שדה חובה" });
    }

    if (!adminUsername) {
      return res.status(400).json({ error: "בחירת מנהל מערכת היא חובה" });
    }

    const { User } = require('../../models');
    const adminUser = await User.findOne({ where: { username: adminUsername } });

    if (!adminUser) {
      return res.status(400).json({ error: "משתמש לא נמצא" });
    }

    const newSystem = await System.create({ name: name.trim() });

    await RoleAssignment.create({
      user_id: adminUser.id,
      scope_type: "system",
      scope_id: newSystem.id,
      role_code: "SYSTEM-ADMIN",
      role_name: "מנהל מערכת"
    });

    res.status(201).json(newSystem);
  } catch (err) {
    catchError(err, req, res);
  }
});

module.exports = router;