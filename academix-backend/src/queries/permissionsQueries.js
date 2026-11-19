const {
  Domain,
  Course,
  CourseBatch,
  Team,
  TeamMember,
  User,
  TaskAssignment,
  Task,
  Axis,
  System,
  TeamCourseBatch,
} = require("../../models");

const { Op } = require("sequelize");
const logger = require("../utils/logger");
const { catchError } = require("../utils/errorHandler");

const getDeveloperData = async () => {
  const allSystems = await System.findAll({
    attributes: ["id"],
  });
  const allSystemIds = allSystems.map((s) => s.id);

  if (allSystemIds.length === 0) {
    return {
      allowedTeamIds: [],
      allowedCourseIds: [],
      allowedCourseBatcheIds: [],
      allowedDomainIds: [],
      allowedAxisIds: [],
    };
  }

  const domains = await Domain.findAll({
    where: { systemId: { [Op.in]: allSystemIds } },
    attributes: ["id"],
  });
  const allowedDomainIds = [...new Set(domains.map((d) => d.id))];

  let allowedCourseIds = [];
  if (allowedDomainIds.length > 0) {
    const courses = await Course.findAll({
      where: { domainId: { [Op.in]: allowedDomainIds } },
      attributes: ["id"],
    });
    allowedCourseIds = [...new Set(courses.map((c) => c.id))];
  }

  let allowedCourseBatcheIds = [];
  if (allowedCourseIds.length > 0) {
    const courseBatches = await CourseBatch.findAll({
      where: { courseId: { [Op.in]: allowedCourseIds } },
      attributes: ["id"],
    });
    allowedCourseBatcheIds = [...new Set(courseBatches.map((cb) => cb.id))];
  }

  let allowedTeamIds = [];
  if (allowedCourseBatcheIds.length > 0) {
    const teams = await Team.findAll({
      where: { course_batch_id: { [Op.in]: allowedCourseBatcheIds } },
      attributes: ["id"],
    });
    allowedTeamIds = [...new Set(teams.map((t) => t.id))];
  }

  let allowedAxisIds = [];
  if (allowedCourseIds.length > 0) {
    const axes = await Axis.findAll({
      where: { courseId: { [Op.in]: allowedCourseIds } },
      attributes: ["id"],
    });
    allowedAxisIds = [...new Set(axes.map((a) => a.id))];
  }

  return {
    allowedTeamIds,
    allowedCourseIds,
    allowedCourseBatcheIds,
    allowedDomainIds,
    allowedAxisIds,
  };
};

const getSystemData = async (id) => {
  const allDomains = await Domain.findAll({
    where: { systemId: id },
    attributes: ["id"],
  });

  const allowedDomainIds = allDomains.map((d) => d.id);

  let allowedCourseIds = [];
  if (allowedDomainIds.length > 0) {
    const courses = await Course.findAll({
      where: { domainId: { [Op.in]: allowedDomainIds } },
      attributes: ["id"],
    });
    allowedCourseIds = courses.map((c) => c.id);
  }

  let allowedCourseBatcheIds = [];
  if (allowedCourseIds.length > 0) {
    const courseBatches = await CourseBatch.findAll({
      where: { courseId: { [Op.in]: allowedCourseIds } },
      attributes: ["id"],
    });
    allowedCourseBatcheIds = courseBatches.map((cb) => cb.id);
  }

  let allowedTeamIds = [];
  if (allowedCourseBatcheIds.length > 0) {
    const teamCourseBatches = await TeamCourseBatch.findAll({
      where: { course_batch_id: { [Op.in]: allowedCourseBatcheIds } },
      attributes: ["team_id"],
    });
    allowedTeamIds = teamCourseBatches.map((tcb) => tcb.team_id);
    // הסר כפילויות
    allowedTeamIds = [...new Set(allowedTeamIds)];
  }

  let allowedAxisIds = [];
  if (allowedCourseIds.length > 0) {
    const axes = await Axis.findAll({
      where: { courseId: { [Op.in]: allowedCourseIds } },
      attributes: ["id"],
    });
    allowedAxisIds = axes.map((a) => a.id);
  }

  const system = await System.findByPk(id);

  return {
    scopeName: system?.name || "all",
    allowedTeamIds: allowedTeamIds,
    allowedCourseIds: allowedCourseIds,
    allowedCourseBatcheIds: allowedCourseBatcheIds,
    allowedDomainIds: allowedDomainIds,
    allowedAxisIds: allowedAxisIds,
  };
};

const getDomainData = async (id) => {
  try {
    if (!id) {
      return {
        scopeName: null,
        allowedTeamIds: [],
        allowedDomainIds: [],
        allowedCourseIds: [],
        allowedCourseBatcheIds: [],
        allowedAxisIds: [],
      };
    }

    const courses = await Course.findAll({ where: { domainId: id } });

    if (courses.length === 0) {
      const domain = await Domain.findByPk(id);
      return {
        scopeName: domain?.name || null,
        allowedTeamIds: [],
        allowedDomainIds: [id],
        allowedCourseIds: [],
        allowedCourseBatcheIds: [],
        allowedAxisIds: [],
      };
    }

    const courseIds = courses.map((c) => c.id);

    const batches = await CourseBatch.findAll({
      where: { courseId: courseIds },
    });

    const axis = await Axis.findAll({
      where: { courseId: courseIds },
    });

    const allowedAxisIds = axis.map((b) => b.id);
    const allowedCourseBatcheIds = batches.map((b) => b.id);

    // ✅ תיקון: שליפת team_ids דרך טבלת החיבור
    let allowedTeamIds = [];

    if (batches.length > 0) {
      const teamCourseBatches = await TeamCourseBatch.findAll({
        where: { course_batch_id: { [Op.in]: allowedCourseBatcheIds } },
        attributes: ["team_id"],
        raw: true,
      });

      const teamIds = teamCourseBatches.map((tcb) => tcb.team_id);

      if (teamIds.length > 0) {
        const domaincourse = await Team.findAll({
          where: { id: { [Op.in]: teamIds } },
        });
        allowedTeamIds = domaincourse.map((t) => t.id);
      }
    }

    const allowedCourseIds = courseIds;
    const domain = await Domain.findByPk(id);

    return {
      scopeName: domain?.name || null,
      allowedTeamIds: allowedTeamIds,
      allowedDomainIds: [id],
      allowedCourseIds: allowedCourseIds,
      allowedCourseBatcheIds: allowedCourseBatcheIds,
      allowedAxisIds: allowedAxisIds,
    };
  } catch (error) {
    // catchError(error, req, res, { function: "getDomainPermissions" });
    return {
      scopeName: null,
      allowedTeamIds: [],
      allowedDomainIds: [],
      allowedCourseIds: [],
      allowedCourseBatcheIds: [],
      allowedAxisIds: [],
    };
  }
};
const getCourseData = async (id) => {
  try {
    if (!id) {
      return {
        scopeName: null,
        allowedTeamIds: [],
        allowedDomainIds: [],
        allowedCourseIds: [],
        allowedCourseBatcheIds: [],
        allowedAxisIds: [],
      };
    }

    // ✅ שליפת המחזורים של הקורס
    const batches = await CourseBatch.findAll({ where: { courseId: id } });
    const allowedCourseBatcheIds = batches.map((b) => b.id);

    if (allowedCourseBatcheIds.length === 0) {
      const course = await Course.findByPk(id);
      return {
        scopeName: course?.name || null,
        allowedTeamIds: [],
        allowedDomainIds: [],
        allowedCourseIds: [id],
        allowedCourseBatcheIds: [],
        allowedAxisIds: [],
      };
    }

    // ✅ תיקון: שליפת team_ids דרך טבלת החיבור
    const teamCourseBatches = await TeamCourseBatch.findAll({
      where: { course_batch_id: { [Op.in]: allowedCourseBatcheIds } },
      attributes: ["team_id"],
      raw: true,
    });

    const teamIds = teamCourseBatches.map((tcb) => tcb.team_id);

    // ✅ שליפת הצוותים האמיתיים
    const courseTeam = await Team.findAll({
      where: { id: { [Op.in]: teamIds } },
    });

    const allowedTeamIds = courseTeam.map((t) => t.id);

    // ✅ שליפת הצירים
    const axis = await Axis.findAll({ where: { courseId: id } });
    const allowedAxisIds = axis.map((b) => b.id);

    const allowedCourseIds = [id];

    const course = await Course.findByPk(id, {
      include: [
        {
          model: Domain,
          attributes: ["id", "name"],
        },
        {
          model: CourseBatch,
          attributes: ["id"],
        },
      ],
    });

    if (!course) {
      return {
        scopeName: null,
        allowedTeamIds: allowedTeamIds,
        allowedDomainIds: [],
        allowedCourseIds: allowedCourseIds,
        allowedCourseBatcheIds: allowedCourseBatcheIds,
        allowedAxisIds: allowedAxisIds,
      };
    }

    const domainId = course.Domain?.id;
    let allowedDomainIds = [];
    if (domainId) {
      const allDomainCourse = await Domain.findAll({
        where: { id: domainId },
      });
      allowedDomainIds = allDomainCourse.map((d) => d.id);
    }

    return {
      scopeName: course.name,
      allowedTeamIds: allowedTeamIds,
      allowedDomainIds: allowedDomainIds,
      allowedCourseIds: allowedCourseIds,
      allowedCourseBatcheIds: allowedCourseBatcheIds,
      allowedAxisIds: allowedAxisIds,
    };
  } catch (error) {
    // catchError(error, req, res);
    return {
      scopeName: null,
      allowedTeamIds: [],
      allowedDomainIds: [],
      allowedCourseIds: [],
      allowedCourseBatcheIds: [],
      allowedAxisIds: [],
    };
  }
};
const getTeamData = async (id, userId) => {
  try {
    // ✅ שליפת הצוות
    const team = await Team.findByPk(id, {
      include: [
        {
          model: Course,
          as: "course",
          include: [{ model: Domain, attributes: ["id", "name"] }],
        },
        {
          model: TeamCourseBatch,
          as: "courseBatches",
          include: [
            {
              model: CourseBatch,
              as: "courseBatch",
              attributes: ["id", "name"],
            },
          ],
        },
      ],
    });

    if (!team) {
      return {
        scopeName: null,
        allowedTeamIds: [],
        allowedCourseIds: [],
        allowedDomainIds: [],
        allowedCourseBatcheIds: [],
        allowedAxisIds: [],
      };
    }

    // ✅ אם יש userId - סנן רק את המחזורים שבהם המשתמש רלוונטי
    let relevantBatchIds = [];

    if (userId) {
      // שליפת כל המחזורים שבהם המשתמש שייך לצוות הזה
      const teamMembers = await TeamMember.findAll({
        where: {
          team_id: id,
          user_id: userId,
        },
        attributes: ["course_batch_id"],
        raw: true,
      });

      relevantBatchIds = teamMembers
        .map((tm) => tm.course_batch_id)
        .filter(Boolean);
    } else {
      // אם אין userId - החזר את כל המחזורים
      relevantBatchIds =
        team.courseBatches?.map((link) => link.course_batch_id) || [];
    }

    // ✅ סינון רק המחזורים הרלוונטיים
    const filteredCourseBatches =
      team.courseBatches?.filter((link) =>
        relevantBatchIds.includes(link.course_batch_id)
      ) || [];

    const courseIds = [team.courseId].filter(Boolean);
    const batchIds = filteredCourseBatches.map((link) => link.course_batch_id);

    // ✅ Domain
    let domainIds = [];
    if (team.course?.Domain?.id) {
      domainIds.push(team.course.Domain.id);
    }

    const axes = courseIds.length
      ? await Axis.findAll({
          where: { courseId: courseIds },
          attributes: ["id"],
        })
      : [];
    const axisIds = axes.map((a) => a.id);

   /*  console.log({
      scopeName: team.name,
      allowedTeamIds: [team.id],
      allowedCourseIds: courseIds,
      allowedDomainIds: domainIds,
      allowedCourseBatcheIds: batchIds,
      allowedAxisIds: axisIds,
    }); */
    
    return {
      scopeName: team.name,
      allowedTeamIds: [team.id],
      allowedCourseIds: courseIds,
      allowedDomainIds: domainIds,
      allowedCourseBatcheIds: batchIds,
      allowedAxisIds: axisIds,
    };

    
  } catch (error) {
    // catchError(error, req, res);
    return {
      scopeName: null,
      allowedTeamIds: [],
      allowedCourseIds: [],
      allowedDomainIds: [],
      allowedCourseBatcheIds: [],
      allowedAxisIds: [],
    };
  }
};

module.exports = {
  getSystemData,
  getDomainData,
  getCourseData,
  getTeamData,
  getDeveloperData,
};
