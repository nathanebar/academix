exports.switchToRole_type = (role_code) => {
  switch (role_code) {
    case "OVERLAP":
      return "team";
    case "STUDENT":
      return "team";
    case "COURSE_COMMANDER":
      return "course";
    case "TEAM_COMMANDER":
    case "OVERLAP":
      return "team";
    default:
      return null;
  }
};