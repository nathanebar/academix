// Permission scopes (allowed domain / course / batch / team / axis ids) of a role assignment.
//
// Each scope is computed with ONE SQL query (CTEs + ARRAY subqueries) instead of a chain of
// 4–8 sequential Sequelize queries, and team scopes are computed for many (team, user) pairs
// in one query (a team commander's request used to run ~4 queries per student).
//
// The results are identical to the previous implementation, including the order of the ids
// (the previous queries had no ORDER BY, so they followed the insertion order: ORDER BY id,
// or ORDER BY the first TeamCourseBatches row for teams de-duplicated from that table) and
// its edge cases (documented next to each query). Only `Axes` is paranoid (soft delete).
const { sequelize } = require("../../models");
const { QueryTypes } = require("sequelize");
const logger = require("../utils/logger");

const EMPTY_IDS = {
  allowedTeamIds: [],
  allowedCourseIds: [],
  allowedCourseBatcheIds: [],
  allowedDomainIds: [],
  allowedAxisIds: [],
};
const emptyScope = () => ({ scopeName: null, ...EMPTY_IDS });

const selectOne = async (sql, replacements) => {
  const [row] = await sequelize.query(sql, { replacements, type: QueryTypes.SELECT });
  return row;
};

// Ids under a set of courses: batches, teams linked to those batches, axes.
// `teams` keeps the order of the first TeamCourseBatches row of each team.
const TREE_FROM_COURSES = `
  b AS (SELECT id FROM "CourseBatches" WHERE "courseId" IN (SELECT id FROM c)),
  t AS (
    SELECT team_id AS id, MIN(id) AS first_link
    FROM "TeamCourseBatches"
    WHERE course_batch_id IN (SELECT id FROM b)
    GROUP BY team_id
  ),
  a AS (SELECT id FROM "Axes" WHERE "courseId" IN (SELECT id FROM c) AND "deletedAt" IS NULL)`;

const TREE_ARRAYS = `
  ARRAY(SELECT id FROM c ORDER BY id) AS "allowedCourseIds",
  ARRAY(SELECT id FROM b ORDER BY id) AS "allowedCourseBatcheIds",
  ARRAY(SELECT id FROM t ORDER BY first_link) AS "allowedTeamIds",
  ARRAY(SELECT id FROM a ORDER BY id) AS "allowedAxisIds"`;

// SYSTEM-ADMIN (scope_type "admin"): everything under every system.
const getDeveloperData = async () => {
  const row = await selectOne(`
    WITH d AS (SELECT id FROM "Domains" WHERE "systemId" IN (SELECT id FROM "Systems")),
    c AS (SELECT id FROM "Courses" WHERE "domainId" IN (SELECT id FROM d)),
    ${TREE_FROM_COURSES}
    SELECT ARRAY(SELECT id FROM d ORDER BY id) AS "allowedDomainIds", ${TREE_ARRAYS}`);
  return { ...EMPTY_IDS, ...row };
};

// scope_type "system". scopeName falls back to "all" when the system does not exist.
const getSystemData = async (id) => {
  const row = await selectOne(
    `
    WITH d AS (SELECT id FROM "Domains" WHERE "systemId" = :id),
    c AS (SELECT id FROM "Courses" WHERE "domainId" IN (SELECT id FROM d)),
    ${TREE_FROM_COURSES}
    SELECT
      (SELECT name FROM "Systems" WHERE id = :id) AS "scopeName",
      ARRAY(SELECT id FROM d ORDER BY id) AS "allowedDomainIds",
      ${TREE_ARRAYS}`,
    { id }
  );
  return { ...row, scopeName: row.scopeName || "all" };
};

// scope_type "domain". Teams are only those that still exist in "Teams".
// A domain without course: allowedDomainIds = [id] and everything else empty.
const getDomainData = async (id) => {
  try {
    if (!id) return emptyScope();
    const row = await selectOne(
      `
      WITH c AS (SELECT id FROM "Courses" WHERE "domainId" = :id),
      b AS (SELECT id FROM "CourseBatches" WHERE "courseId" IN (SELECT id FROM c)),
      a AS (SELECT id FROM "Axes" WHERE "courseId" IN (SELECT id FROM c) AND "deletedAt" IS NULL)
      SELECT
        (SELECT name FROM "Domains" WHERE id = :id) AS "scopeName",
        ARRAY(SELECT id FROM c ORDER BY id) AS "allowedCourseIds",
        ARRAY(SELECT id FROM b ORDER BY id) AS "allowedCourseBatcheIds",
        ARRAY(SELECT id FROM a ORDER BY id) AS "allowedAxisIds",
        ARRAY(
          SELECT tm.id FROM "Teams" tm
          WHERE tm.id IN (SELECT team_id FROM "TeamCourseBatches" WHERE course_batch_id IN (SELECT id FROM b))
          ORDER BY tm.id
        ) AS "allowedTeamIds"`,
      { id }
    );
    return {
      scopeName: row.scopeName || null,
      allowedTeamIds: row.allowedCourseIds.length ? row.allowedTeamIds : [],
      allowedDomainIds: [id],
      allowedCourseIds: row.allowedCourseIds,
      allowedCourseBatcheIds: row.allowedCourseBatcheIds,
      allowedAxisIds: row.allowedAxisIds,
    };
  } catch (error) {
    logger.error("getDomainData failed", { scopeId: id, originalError: error.message });
    return emptyScope();
  }
};

// scope_type "course". Edge cases kept from the previous implementation:
// - a course without batch returns only allowedCourseIds = [id] (no axes, no domain);
// - allowedDomainIds contains the domain only if it exists.
const getCourseData = async (id) => {
  try {
    if (!id) return emptyScope();
    const row = await selectOne(
      `
      WITH b AS (SELECT id FROM "CourseBatches" WHERE "courseId" = :id)
      SELECT
        co.name AS "scopeName",
        (co.id IS NOT NULL) AS "courseExists",
        ARRAY(SELECT dm.id FROM "Domains" dm WHERE dm.id = co."domainId") AS "allowedDomainIds",
        ARRAY(SELECT id FROM b ORDER BY id) AS "allowedCourseBatcheIds",
        ARRAY(SELECT id FROM "Axes" WHERE "courseId" = :id AND "deletedAt" IS NULL ORDER BY id) AS "allowedAxisIds",
        ARRAY(
          SELECT tm.id FROM "Teams" tm
          WHERE tm.id IN (SELECT team_id FROM "TeamCourseBatches" WHERE course_batch_id IN (SELECT id FROM b))
          ORDER BY tm.id
        ) AS "allowedTeamIds"
      FROM (SELECT 1) one
      LEFT JOIN "Courses" co ON co.id = :id`,
      { id }
    );
    const base = {
      scopeName: row.scopeName || null,
      allowedTeamIds: [],
      allowedDomainIds: [],
      allowedCourseIds: [id],
      allowedCourseBatcheIds: [],
      allowedAxisIds: [],
    };
    if (row.allowedCourseBatcheIds.length === 0) return base;
    return {
      ...base,
      scopeName: row.courseExists ? row.scopeName : null,
      allowedTeamIds: row.allowedTeamIds,
      allowedDomainIds: row.courseExists ? row.allowedDomainIds : [],
      allowedCourseBatcheIds: row.allowedCourseBatcheIds,
      allowedAxisIds: row.allowedAxisIds,
    };
  } catch (error) {
    logger.error("getCourseData failed", { scopeId: id, originalError: error.message });
    return emptyScope();
  }
};

// scope_type "team", for many (teamId, userId) pairs in one query. Returns one result per
// pair, in the same order. allowedCourseBatcheIds = the team's batches in which the user is
// a member of that team (all the team's batches when userId is empty).
const getTeamDataBatch = async (pairs) => {
  if (pairs.length === 0) return [];
  try {
    const rows = await sequelize.query(
      `
      WITH p AS (
        SELECT * FROM unnest(ARRAY[:teamIds]::int[], ARRAY[:userIds]::int[])
          WITH ORDINALITY AS x(team_id, user_id, ord)
      )
      SELECT
        p.ord,
        t.id AS "teamId",
        t.name AS "scopeName",
        t."courseId",
        dm.id AS "domainId",
        ARRAY(
          SELECT l.course_batch_id FROM "TeamCourseBatches" l
          WHERE l.team_id = t.id
            AND (
              p.user_id IS NULL OR l.course_batch_id IN (
                SELECT m.course_batch_id FROM "TeamMembers" m
                WHERE m.team_id = t.id AND m.user_id = p.user_id AND m.course_batch_id IS NOT NULL
              )
            )
          ORDER BY l.id
        ) AS "allowedCourseBatcheIds",
        ARRAY(
          SELECT a.id FROM "Axes" a
          WHERE a."courseId" = t."courseId" AND a."deletedAt" IS NULL
          ORDER BY a.id
        ) AS "allowedAxisIds"
      FROM p
      LEFT JOIN "Teams" t ON t.id = p.team_id
      LEFT JOIN "Courses" co ON co.id = t."courseId"
      LEFT JOIN "Domains" dm ON dm.id = co."domainId"
      ORDER BY p.ord`,
      {
        replacements: {
          teamIds: pairs.map((pair) => pair.teamId ?? null),
          userIds: pairs.map((pair) => pair.userId || null),
        },
        type: QueryTypes.SELECT,
      }
    );
    return rows.map((row) =>
      row.teamId === null
        ? emptyScope()
        : {
            scopeName: row.scopeName,
            allowedTeamIds: [row.teamId],
            allowedCourseIds: row.courseId ? [row.courseId] : [],
            allowedDomainIds: row.domainId ? [row.domainId] : [],
            allowedCourseBatcheIds: row.allowedCourseBatcheIds,
            allowedAxisIds: row.allowedAxisIds,
          }
    );
  } catch (error) {
    logger.error("getTeamDataBatch failed", { pairs: pairs.length, originalError: error.message });
    return pairs.map(emptyScope);
  }
};

const getTeamData = async (id, userId) => {
  const [data] = await getTeamDataBatch([{ teamId: id, userId }]);
  return data;
};

module.exports = {
  getSystemData,
  getDomainData,
  getCourseData,
  getTeamData,
  getTeamDataBatch,
  getDeveloperData,
};
