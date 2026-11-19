export const getDomainHeaderName = (permission: any) => {


    switch (permission?.scope_type) {
        case "course":
            return permission.course.Domain.name
            break;
        case "domain":
            return permission.domain.name
        case "team":
            return permission.team.CourseBatch.Course.Domain.name
        default:
            break;
    }

}
export const getCourseHeaderName = (permission: any) => {


    switch (permission?.scope_type) {
        case "course":
            return permission.course.name
        case "domain":
            return permission.domain.Courses.name
        case "team":
            return permission.team.CourseBatch.Course.name
        default:
            break;
    }



}