const { RoleAssignment,User } = require("../../models");
const {
  getSystemData,
  getDomainData,
  getCourseData,
  getTeamDataBatch,
  getDeveloperData,
} = require("../queries/permissionsQueries");

const withScope = (assignment, data) => ({
  ...assignment,
  scopeName: data.scopeName || "developer",
  allowedTeamIds: data.allowedTeamIds,
  allowedCourseIds: data.allowedCourseIds,
  allowedCourseBatcheIds: data.allowedCourseBatcheIds,
  allowedAxisIds: data.allowedAxisIds,
  allowedDomainIds: data.allowedDomainIds,
});

// Adds the allowed ids to each assignment. Team scopes (most of them: one per student of a
// team commander) are computed together in one query; the other scopes run in parallel,
// one query each.
const withScopes = async (assignments) => {
  const teamIndexes = [];
  const teamPairs = [];
  assignments.forEach((assignment, index) => {
    if (assignment.scope_type === "team") {
      teamIndexes.push(index);
      teamPairs.push({ teamId: assignment.scope_id, userId: assignment.user_id });
    }
  });

  const singleScope = {
    system: (a) => getSystemData(a.scope_id),
    domain: (a) => getDomainData(a.scope_id),
    course: (a) => getCourseData(a.scope_id),
    admin: () => getDeveloperData(),
  };

  const [teamData, otherData] = await Promise.all([
    getTeamDataBatch(teamPairs),
    Promise.all(
      assignments.map((assignment) => {
        const getData = singleScope[assignment.scope_type];
        return getData ? getData(assignment) : null;
      })
    ),
  ]);

  const results = assignments.map((assignment, index) =>
    otherData[index] ? withScope(assignment, otherData[index]) : assignment
  );
  teamIndexes.forEach((assignmentIndex, i) => {
    results[assignmentIndex] = withScope(assignments[assignmentIndex], teamData[i]);
  });
  return results;
};

const getPermissionsForUser = async (userId) => {
  const assignments = await RoleAssignment.findAll({
    where: { user_id: userId },
    raw: true
  });

  // ✅ Find all OVERLAP and TEAM_COMMANDER assignments
  const overlapAssignments = assignments.filter(a => a.role_code === 'OVERLAP');
  const teamCommanderAssignments = assignments.filter(a => a.role_code === 'TEAM_COMMANDER');

  // ✅ Combine all scope_ids from both roles
  const relevantScopeIds = [
    ...overlapAssignments.map(a => a.scope_id),
    ...teamCommanderAssignments.map(a => a.scope_id)
  ];

  let studentAssignments = [];

  if (relevantScopeIds.length > 0) {
    // Remove duplicates
    const uniqueScopeIds = [...new Set(relevantScopeIds)];


    // ✅ Fetch STUDENT roles with matching scope_id
   studentAssignments = await RoleAssignment.findAll({
  where: {
    role_code: 'STUDENT',
    scope_id: uniqueScopeIds
  },
  include: [
    {
      model: User,
      attributes: ['name'],
    }
  ],
  raw: true,
  nest: true
});
  }


  const filteredAssignments = assignments.filter(assignment => assignment.scope_type !== "admin");
  const adminAssignment = assignments.find(a => a.scope_type === "admin");

  const [processedAssignments, processedStudentAssignments, processedAdmin] = await Promise.all([
    withScopes(filteredAssignments),
    withScopes(studentAssignments),
    adminAssignment
      ? getDeveloperData().then((data) => withScope(adminAssignment, { ...data, scopeName: "developer" }))
      : null,
  ]);

  return processedAdmin
    ? [...processedAssignments, ...processedStudentAssignments, processedAdmin]
    : [...processedAssignments, ...processedStudentAssignments];
};
module.exports = { getPermissionsForUser };
