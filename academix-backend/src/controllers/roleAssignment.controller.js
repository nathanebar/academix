const { RoleAssignment, User, Course, Domain, Team } = require("../../models");
const logger = require('../utils/logger');
const { catchError } = require('../utils/errorHandler');

module.exports = {
  async getAll(req, res) {
    try {
      const roles = await RoleAssignment.findAll({
        include: [
          {
            model: User,
            attributes: ["name", "username", "militaryid"],
          },
        ],
      });
      res.status(200).json(roles);
    } catch (err) {
      catchError(err, req, res, { function: 'getAll' });
    }
  },
  async getAllByUser(req, res) {
    try {
      const userId = req.user?.id || 3;

      const roles = await RoleAssignment.findAll({
        where: { user_id: userId },
      });
      res.json(roles);
    } catch (err) {
      catchError(err, req, res, { function: 'getAllByUser', userId: req.user?.id });
    }
  },

  async getById(req, res) {
    try {
      const item = await RoleAssignment.findByPk(req.params.id);
      if (!item) return res.status(404).json({ error: "Not found" });
      res.json(item);
    } catch (err) {
      catchError(err, req, res, { function: 'getById', roleAssignmentId: req.params.id });
    }
  },

  async getCourseComnmander(req, res) {
    const scope_id = req.params.id;

    try {
      const item = await RoleAssignment.findAll({
        where: {
          role_code: "COURSE_COMMANDER",
          scope_id: scope_id,
        },
        include: ["User"],
        attributes: ["User.name"],
      });
      if (!item) return res.status(404).json({ error: "Not found" });
      res.json(item);
    } catch (err) {
      catchError(err, req, res, { function: 'getCourseComnmander', scope_id });
    }
  },

  async create(req, res) {
    const { username, role_code, scope_type, scope_id, course_id, domain_id } =
      req.body;
    const user = await User.findOne({
      where: {
        username: username,
      },
    });
    if (!user) {
      return res.status(401).json({
        error: "User doesnt exist!",
      });
    }

    const existingRoles = await RoleAssignment.findAll({
      where: {
        user_id: user.dataValues.id,
      },
      include: [
        {
          model: Domain,
          as: "domain",
        },
      ],
    });

  let duplicateRole;
  
  if (scope_type === 'team') {
    // For team scope: only block if same role in SAME team
    duplicateRole = existingRoles?.find(
      (r) => r?.domain?.id === domain_id && 
             r.scope_id === scope_id 
    );
  } else {
    // For other scopes: block if any role in domain
    duplicateRole = existingRoles?.find(
      (r) => r?.domain?.id === domain_id
    );
  }

    if (duplicateRole) {
      const roleLabels = {
        DOMAIN_MANAGER: "מנהל תחום",
        COURSE_COMMANDER: "מפקד קורס",
        TEAM_COMMANDER: "מפקד צוות",
        OVERLAP: "חופף",
      };
      return res.status(409).json({
        error: "User already has this role in this scope",
        role: roleLabels[duplicateRole?.role_code] ?? "חניך",
      });
    }

    const roleAssignmentData = {
      user_id: user.dataValues.id,
      role_code,
      scope_type,
      scope_id: scope_id || null,
    };

    const newItem = await RoleAssignment.create(roleAssignmentData);

    logger.info('RoleAssignment created', {
      roleAssignmentId: newItem.id,
      userId: user.dataValues.id,
      username: username,
      roleCode: role_code,
      scopeType: scope_type,
      scopeId: scope_id,
      userId: req.headers['x-user-id']
    });
    return res.status(201).json(duplicateRole);
  },

  async update(req, res) {
    try {
      const item = await RoleAssignment.findByPk(req.params.id);
      if (!item) return res.status(404).json({ error: "Not found" });
      await item.update(req.body);

      logger.info('RoleAssignment updated', {
        roleAssignmentId: req.params.id,
        previousData: previousData,
        updatedFields: Object.keys(req.body),
        userId: req.headers['x-user-id']
      });
      res.json(item);
    } catch (err) {
      catchError(err, req, res, { function: 'update', roleAssignmentId: req.params.id });
    }
  },

  async remove(req, res) {
    const { userId, scopeId } = req.params;

    try {
      const item = await RoleAssignment.destroy({
        where: { user_id: userId, scope_id: scopeId },
      });

      if (!item) {
        return res.status(404).json({ msg: "role assignment not found!" });
      }

      logger.info('RoleAssignment deleted', {
        userId: userId,
        scopeId: scopeId,
        userId: req.headers['x-user-id']
      });
      res.status(200).json({ message: "role assignment deleted!" });
    } catch (err) {
      catchError(err, req, res, { function: 'remove', userId, scopeId });
    }
  },
};
