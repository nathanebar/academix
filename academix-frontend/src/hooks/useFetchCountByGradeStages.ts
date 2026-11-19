import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";

const fechTaskByGradeStages = async (
  teamIds: (string | number)[] | number | string,
  selectedCourseBatch :number
) => {

  const ids =
    typeof teamIds !== "string" && typeof teamIds !== "number"
      ? teamIds?.join(",")
      : String(teamIds);
  const headers =
    typeof teamIds !== "string" && typeof teamIds !== "number"
      ? { teamids: ids ,selectedCourseBatch }
      : { courseid: ids ,selectedCourseBatch };
  try {
    const { data } = await api.get(`/gradeStages/task-count`, {
      headers: headers,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};
export const useFetchCountByGradeStages = (
  teamIds: (string | number)[] | number | string,
  selectedCourseBatch:number
) => {
  return useQuery({
    queryKey: ["taskCountByGradeStages", teamIds,selectedCourseBatch],
    queryFn: () => fechTaskByGradeStages(teamIds,selectedCourseBatch),
    enabled: JSON.stringify(teamIds)?.length > 0,
  });
};
