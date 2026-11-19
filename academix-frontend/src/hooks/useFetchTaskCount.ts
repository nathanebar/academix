import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";

const fechTaskByAxis = async (
  axisIds: (string | number)[] | number | string,
  teamId:  number | string, 
  selectedCourseBatch: number
) => {
  const ids =
    typeof axisIds !== "string" && typeof axisIds !== "number"
      ? axisIds?.join(",")
      : String(axisIds);
  const headers =
    {axisids: ids, selectedCourseBatch: selectedCourseBatch}
  try {
    const { data } = await api.get(`/axes/task-count/${teamId}`, {
      headers: headers,
    });
    return data;
  } catch (error) {
    console.log(error);
  }
};
export const useTaskCount = (
  axisIds: (string | number)[] | number | string,
  teamId:  number | string, 
  selectedCourseBatch: number
) => {
  return useQuery({
    queryKey: ["taskCountByAxis", axisIds, teamId],
    queryFn: () => fechTaskByAxis(axisIds!, teamId, selectedCourseBatch),
    enabled: !!teamId && JSON.stringify(axisIds)?.length > 0,
  });
};
