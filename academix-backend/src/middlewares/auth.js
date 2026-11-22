// Server-side identity and permission (#13, step 1 of the contract).
//
// - authenticate: the user comes from the `token` cookie (JWT), never from the client.
//   With a valid token, the X-User-Id / X-User-Name headers are OVERWRITTEN with the token's
//   user, so every existing `req.headers['x-user-id']` read (creator_id, assigned_by...)
//   now gets the real user without changing the controllers.
//   Without a valid token: 401 { error: "unauthenticated" } when REQUIRE_AUTH=true,
//   otherwise the old header-based behavior still works (until step 3).
// - resolvePermission: `X-Role-Assignment-Id` (the active role chosen in the UI) is checked
//   against the user, and its allowed ids are computed server-side (req.permission). The
//   `selectedpermission` header read by the controllers is overwritten with its role code.
// - restrictAllowedIds: the allowed*Ids query params of the getAllowed* endpoints are
//   intersected with req.permission, so a client can narrow a list but not widen it.
const jwt = require("jsonwebtoken");
const { RoleAssignment, User } = require("../../models");
const { withScopes } = require("../services/permissions.service");
const logger = require("../utils/logger");

const REQUIRE_AUTH = process.env.REQUIRE_AUTH === "true";
const SUPERVISOR_ROLES = ["TEAM_COMMANDER", "OVERLAP"];

const unauthenticated = (res) => res.status(401).json({ error: "unauthenticated" });
const forbidden = (res) => res.status(403).json({ error: "forbidden" });
const toId = (value) => (/^\d+$/.test(String(value ?? "").trim()) ? Number(value) : null);

const authenticate = async (req, res, next) => {
  let payload = null;
  if (req.cookies?.token) {
    try {
      payload = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    } catch {
      payload = null; // expired or forged: treated as no token
    }
  }

  if (payload) {
    let id = toId(payload.id);
    if (!id && payload.username) {
      // Tokens issued before the id was added to the payload (valid until they expire).
      const user = await User.findOne({ where: { username: payload.username }, attributes: ["id"], raw: true });
      id = user?.id ?? null;
    }
    if (id) {
      req.user = { id, username: payload.username, name: payload.name };
      const claimed = req.headers["x-user-id"];
      if (claimed && String(claimed) !== String(id)) {
        logger.warn("X-User-Id header ignored (differs from the authenticated user)", {
          claimed,
          userId: id,
          endpoint: req.originalUrl,
        });
      }
      req.headers["x-user-id"] = String(id);
      req.headers["x-user-name"] = payload.username || ""; // only used in error logs
      return next();
    }
  }

  if (REQUIRE_AUTH) return unauthenticated(res);
  next();
};

// A user may act with one of their own role assignments, or "view as student" with a STUDENT
// role assignment on a team where they are TEAM_COMMANDER or OVERLAP.
const canUseRoleAssignment = async (user, assignment) => {
  if (!assignment) return false;
  if (assignment.user_id === user.id) return true;
  if (assignment.role_code !== "STUDENT" || assignment.scope_type !== "team" || !assignment.scope_id) {
    return false;
  }
  const supervisor = await RoleAssignment.count({
    where: {
      user_id: user.id,
      role_code: SUPERVISOR_ROLES,
      scope_type: "team",
      scope_id: assignment.scope_id,
    },
  });
  return supervisor > 0;
};

const resolvePermission = async (req, res, next) => {
  const header = req.headers["x-role-assignment-id"];
  if (header === undefined || header === "") return next();
  // Without an authenticated user the header cannot be checked: ignored (old behavior),
  // unless REQUIRE_AUTH (then authenticate already answered 401).
  if (!req.user) return next();

  const id = toId(header);
  if (!id) return forbidden(res);
  const assignment = await RoleAssignment.findByPk(id, { raw: true });
  if (!(await canUseRoleAssignment(req.user, assignment))) {
    logger.warn("X-Role-Assignment-Id refused", { roleAssignmentId: header, userId: req.user.id });
    return forbidden(res);
  }

  const [scoped] = await withScopes([assignment]);
  req.permission = {
    roleAssignmentId: assignment.id,
    roleCode: assignment.role_code,
    scopeType: assignment.scope_type,
    scopeId: assignment.scope_id,
    allowedDomainIds: scoped.allowedDomainIds || [],
    allowedCourseIds: scoped.allowedCourseIds || [],
    allowedCourseBatcheIds: scoped.allowedCourseBatcheIds || [],
    allowedTeamIds: scoped.allowedTeamIds || [],
    allowedAxisIds: scoped.allowedAxisIds || [],
  };
  // The controllers read the active role from this header: it now comes from the server.
  req.headers.selectedpermission = assignment.role_code;
  next();
};

// Wraps a middleware so that errors (DB down...) go to Express' error handler.
const safe = (middleware) => (req, res, next) =>
  Promise.resolve(middleware(req, res, next)).catch(next);

/**
 * Intersects the comma-separated query param `param` with req.permission[field].
 * Express 5's req.query is a getter that re-parses the URL on each access, so the filtered
 * object is installed as an own property of the request.
 */
const restrictAllowedIds = (param, field) => (req, res, next) => {
  if (!req.permission) return next();
  const query = { ...req.query };
  const raw = Array.isArray(query[param]) ? query[param].join(",") : query[param];
  if (typeof raw === "string") {
    const allowed = new Set(req.permission[field].map(String));
    query[param] = raw
      .split(",")
      .map((value) => value.trim())
      .filter((value) => allowed.has(value))
      .join(",");
    Object.defineProperty(req, "query", { value: query, writable: true, configurable: true });
  }
  next();
};

// The getAllowed* endpoints and the permission list each query param is checked against.
// Some param names are misleading: allowedteamMembersIds holds team ids, allowedAxisBatchIds
// a course batch id.
const ALLOWED_IDS_ROUTES = [
  ["/api/domains/getAllowedDomains", "allowedDomainsIds", "allowedDomainIds"],
  ["/api/courses/getAllowedCourses", "allowedCoursesIds", "allowedCourseIds"],
  ["/api/courseBatch/getAllowedCourseBatches", "allowedCourseBatcheIds", "allowedCourseBatcheIds"],
  ["/api/teams/getAllowedTeams", "allowedTeamsIds", "allowedTeamIds"],
  ["/api/axes/getAllowedAxes", "allowedAxesIds", "allowedAxisIds"],
  ["/api/axisBatch/getAllowedAxisBatchArchives", "allowedAxisBatchIds", "allowedCourseBatcheIds"],
  ["/api/teamMembers/getAllowedUsersInTeam", "allowedteamMembersIds", "allowedTeamIds"],
];

/** Installs authentication, permission resolution and allowed-ids filtering on /api. */
const installAuth = (app) => {
  const exceptAuthRoutes = (middleware) => (req, res, next) =>
    req.path.startsWith("/auth") ? next() : middleware(req, res, next);
  app.use("/api", exceptAuthRoutes(safe(authenticate)));
  app.use("/api", exceptAuthRoutes(safe(resolvePermission)));
  for (const [path, param, field] of ALLOWED_IDS_ROUTES) {
    app.get(path, restrictAllowedIds(param, field));
  }
};

module.exports = { installAuth, authenticate, resolvePermission, restrictAllowedIds, canUseRoleAssignment };
