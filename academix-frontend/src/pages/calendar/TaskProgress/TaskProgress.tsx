import TaskTeamTag from "../../../components/Task/TaskTag/TaskTeamTag";
import TaskUserTag from "../../../components/Task/TaskTag/TaskUserTag";

interface TaskProgressProps {
  activeHeaderType: "teamMember" | "team";
  task: any;                         // לפני שיש לך טיפוס חזק יותר – אפשר להחליף ל‑TaskAssignment
}
export const TaskProgress = ({
  activeHeaderType,
  task,
}: TaskProgressProps) =>
  activeHeaderType === "teamMember" ? (
    <TaskUserTag task={task} />
  ) : (
    <TaskTeamTag task={task} />
  );