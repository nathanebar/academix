const { RoleAssignment,User } = require("../../models");
const { getSystemData, getDomainData, getCourseData, getTeamData, getDeveloperData } = require("../queries/permissionsQueries");

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
  
  const processData = async (assignment) => {
    const dataMap = {
      system: () => getSystemData(assignment.scope_id),
      domain: () => getDomainData(assignment.scope_id),
      course: () => getCourseData(assignment.scope_id),
      team: () => getTeamData(assignment.scope_id, assignment.user_id),
      admin: () => getDeveloperData()
    };
    const getData = dataMap[assignment.scope_type];
    if (!getData) return assignment;
    const data = await getData();
    return {
      ...assignment,
      scopeName: data.scopeName || "developer",
      allowedTeamIds: data.allowedTeamIds,
      allowedCourseIds: data.allowedCourseIds,
      allowedCourseBatcheIds: data.allowedCourseBatcheIds,
      allowedAxisIds: data.allowedAxisIds,
      allowedDomainIds: data.allowedDomainIds
    };
  };

  const adminAssignment = assignments.find(a => a.scope_type === "admin");
  let processedAdmin = null;

  if (adminAssignment) {
    const adminData = await getDeveloperData();
    processedAdmin = {
      ...adminAssignment,
      scopeName: "developer",
      allowedTeamIds: adminData.allowedTeamIds,
      allowedCourseIds: adminData.allowedCourseIds,
      allowedCourseBatcheIds: adminData.allowedCourseBatcheIds,
      allowedAxisIds: adminData.allowedAxisIds,
      allowedDomainIds: adminData.allowedDomainIds
    };
  }

  const processedAssignments = await Promise.all(filteredAssignments.map(processData));
  const processedStudentAssignments = await Promise.all(studentAssignments.map(processData));


  return processedAdmin 
    ? [...processedAssignments, ...processedStudentAssignments, processedAdmin]
    : [...processedAssignments, ...processedStudentAssignments];
};
module.exports = { getPermissionsForUser };