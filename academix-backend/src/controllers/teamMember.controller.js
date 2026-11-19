const { Op } = require("sequelize");
const { TeamMember, Team, User, RoleAssignment, TeamCourseBatch, TaskAssignment, } = require("../../models");
const logger = require('../utils/logger');
const { catchError } = require('../utils/errorHandler');
const { switchToRole_type } = require("../utils/switchToRole_type");
exports.getAll = async (req, res) => {
  const data = await TeamMember.findAll();
  res.json(data);
};

exports.getAllowedUsersInTeam = async (req, res) => {
  try {
    const { allowedteamMembersIds, courseBatchId } = req.query;

    // בדיקה אם יש פרמטרים
    if (!allowedteamMembersIds || typeof allowedteamMembersIds !== "string") {
      return res.json([]);
    }

    // המרה ל-array של מספרים
    const numericIds = allowedteamMembersIds
      .split(",")
      .map((id) => Number(id.trim()))
      .filter((id) => !isNaN(id));

    if (numericIds.length === 0) {
      return res.json([]);
    }

    // בניית ה-where dynamic
    const whereClause = {
      team_id: numericIds,
    };

    // רק אם יש courseBatchId - הוסף לתנאי
    if (courseBatchId) {
      whereClause.course_batch_id = courseBatchId;
    }

    const teamMembers = await TeamMember.findAll({
      where: whereClause,
      include: [
        "User",
        {
          model: Team,
          attributes: ["name"],
        },
      ],
      order: [["id", "ASC"]],
    });

    res.json(teamMembers);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getById = async (req, res) => {
  const data = await TeamMember.findByPk(req.params.id);
  data ? res.json(data) : res.status(404).json({ error: "Not found" });
};

exports.create = async (req, res) => {
  const {
    team_id,
    username,
    member_role,
    course_batch_id,
    courseID,
    doamin_id,
  } = req.body;

  try {
    const user = await User.findOne({
      where: {
        username: username,
      },
    });
    const existingMember = await TeamMember.findOne({
      where: {
        user_id: user.dataValues.id,
        team_id: team_id,
        course_batch_id: course_batch_id,
      },
    });

    if (existingMember) {
      return res.status(409).json({
        error: "User is already a member of this team",
      });
    }

    const existingCourseCommander = await RoleAssignment.findOne({
      where: {
        user_id: user.dataValues.id,
        role_code: "COURSE_COMMANDER",
        scope_id: courseID,
      },
    });

    if (existingCourseCommander) {
      return res.status(409).json({
        error: "User is already a courseCommander",
      });
    }
    const existingDomainManager = await RoleAssignment.findOne({
      where: {
        user_id: user.dataValues.id,
        role_code: "DOMAIN_MANAGER",
        scope_id: doamin_id,
      },
    });

    if (existingDomainManager) {
      return res.status(409).json({
        error: "User is already DomainManager",
      });
    }

    const teamMemberData = {
      team_id: team_id,
      user_id: user.dataValues.id,
      member_role: member_role,
      course_batch_id: course_batch_id,
    };

    const data = await TeamMember.create(teamMemberData);

    logger.info('TeamMember created', {
      teamMemberId: data.id,
      teamId: team_id,
      userId: user.dataValues.id,
      username: username,
      memberRole: member_role,
      courseBatchId: course_batch_id,
      userId: req.headers['x-user-id']
    });

    res.status(201).json(data);
  } catch (error) {
    console.log(error);
    res.json(500).json({ msg: "Internal Server Error" });
  }
};

exports.update = async (req, res) => {
  try {
    const paramsArray = req.params.id.split(",");
    if (req.body.member_role === "COURSE_COMMANDER") {
      const deleteTeamMember = await TeamMember.destroy({
        where: { team_id: paramsArray[0], user_id: paramsArray[1] },
      });
      if (deleteTeamMember > 0) {
        const data = {
          user_id: paramsArray[1],
          role_code: "COURSE_COMMANDER",
          scope_type: "course",
          scope_id: paramsArray[2],
        };
        const create = await RoleAssignment.create(data);
        if (create) {
          logger.info('TeamMember promoted to Course Commander', {
            'x-user-id': req.headers['x-user-id']
          });
          res.status(201).json({ msg: "RoleAssignment created Successfully " });
        } else {
          res.status(409).json({ msg: "RoleAssignment not created" });
        }
      } else {
        res
          .status(409)
          .json({ msg: "user not found at teamMember Controller on update" });
      }
      return;
    }
    const isExistInRoleAssignment = await RoleAssignment.findAll({
      where: {
        role_code: "COURSE_COMMANDER",
        user_id: paramsArray[1],
        scope_id: paramsArray[2],
      },
    });
    if (isExistInRoleAssignment.length > 0) {
      const dataToTM = {
        member_role: req.body.member_role,
        user_id: paramsArray[1],
        team_id: paramsArray[0],
        course_batch_id: paramsArray[3],
      };
      const dataTORA = {
        user_id: paramsArray[1],
        role_code: req.body.member_role,
        scope_type: switchToRole_type(req.body.member_role),
        scope_id: paramsArray[0],
      };
      const create = await TeamMember.create(dataToTM);
      const deleteRoleAssignment = await RoleAssignment.update(dataTORA, {
        where: {
          scope_id: paramsArray[2],
          user_id: paramsArray[1],
          role_code: "COURSE_COMMANDER",
        },
      });

      logger.info('TeamMember demoted from Course Commander', {
        teamId: teamId,
        userId: userId,
        newRole: req.body.member_role,
        userId: req.headers['x-user-id']
      });

      res.status(201).json({ msg: "Tm creeated and RA updated" });
      return;
    }

    const teamMemberUpdated = await TeamMember.update(req.body, {
      where: { team_id: paramsArray[0], user_id: paramsArray[1] },
    });
    if (teamMemberUpdated) {
      const teamMemberId = await TeamMember.findOne({
        where: {
          team_id: paramsArray[0],
          user_id: paramsArray[1],
        },
      });
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const deleteAssignments = await TaskAssignment.destroy({
        where: {
          user_id: teamMemberId.id,
          start: {
            [Op.gte]: today,
          },
        },
      });
      if (deleteAssignments) console.log(deleteAssignments);

      res
        .status(201)
        .json({ success: true, msg: "User updated succsessfully!" });
    }

    if (teamMemberUpdated[0] > 0) {
      const assigmentUpdate = {
        role_code: req.body.member_role,
      };
      const roleAssignmentUpdate = await RoleAssignment.update(
        assigmentUpdate,
        {
          where: { scope_id: paramsArray[0], user_id: paramsArray[1] },
        }
      );

      logger.info('TeamMember updated', {
        teamId: teamId,
        userId: userId,
        updatedFields: Object.keys(req.body),
        userId: req.headers['x-user-id']
      });

      roleAssignmentUpdate[0] !== 0 && teamMemberUpdated[0] !== 0
        ? res
          .status(201)
          .json({ success: true, msg: "User updated succsessfully!" })
        : res.status(404).json({ error: "Not found" });
      return;
    }
    teamMemberUpdated[0] !== 0
      ? res
        .status(201)
        .json({ success: true, msg: "User updated succsessfully!" })
      : res.status(404).json({ error: "Not found" });
  } catch (error) {
    console.log(error);
  }
};

exports.remove = async (req, res) => {
  const paramsArray = req.params.id.split(",");
  const teamMemberDeleted = await TeamMember.destroy({
    where: { team_id: paramsArray[0], user_id: paramsArray[1] },
  });

  if (teamMemberDeleted) {
    logger.info('TeamMember deleted', {
      userId: req.headers['x-user-id']
    });

    res.status(201).json({
      success: true,
      msg: "User in TeamMember deleted succsessfully!",
    });
  } else {
    res.status(404).json({ error: "Not found" });
  }
};

exports.getByTeamId = async (req, res) => {
  const teamId = req.params.teamId;
  const courseBatchId = req.params.courseBatchId;
  try {
    const teamMembers = await TeamMember.findAll({
      where: { team_id: teamId, course_batch_id: courseBatchId },
      include: [
        {
          model: User,
          attributes: ["id", "username", "name", "militaryid"],
        },
      ],
    });
    res.json(teamMembers);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
exports.getTeamMemberByUserIdAndTeamId = async (req, res) => {
  const { userId, teamId } = req.params;

  try {
    const teamMember = await TeamMember.findOne({
      where: {
        user_id: userId,
        team_id: teamId,
      },
      include: [
        {
          model: User,
          attributes: ["id", "username", "name", "militaryid"],
        },
        {
          model: Team,
          attributes: ["name"],
        },
      ],
    });

    if (!teamMember) {
      return res.status(404).json({ error: "Team member not found" });
    }
    res.json(teamMember);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.countByBatch = async (req, res) => {
  const { batchId } = req.params;

  if (!batchId || isNaN(batchId)) {
    return res.status(400).json({ error: "Invalid batchId" });
  }

  try {
    // ✅ שליפה דרך טבלת החיבור
    const count = await TeamMember.count({
      where: {
        member_role: { [Op.in]: ["STUDENT", "OVERLAP"] },
        course_batch_id: Number(batchId),
      },
      // include: [
      //   {
      //     model: Team,
      //     required: true,
      //     include: [
      //       {
      //         model: TeamCourseBatch,
      //         as: "courseBatches",
      //         where: {
      //           course_batch_id: Number(batchId),
      //         },
      //         required: true,
      //       },
      //     ],
      //     attributes: [],
      //   },
      // ],
    });

    return res.json({ batchId: Number(batchId), count });
  } catch (err) {
    catchError(err, req, res);
  }
};
