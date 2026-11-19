import { useMemo, useState, useEffect } from "react";
import style from "./FeedBackDashByTeam.module.css";
import { Button } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import TempleteFeedback from "../FeedbackDashFilter/TempleteFeedback/TempleteFeedback";

interface FeedBackDashByTeamProps {
  // task type here
  tasks: any[];
}

const FeedBackDashByTeam = ({ tasks }: FeedBackDashByTeamProps) => {
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    setCurrentPage(1);
  }, [tasks]);

  const totalPages = useMemo(() => {
    return Math.ceil(tasks.length / itemsPerPage);
  }, [tasks.length]);

  const paginatedTasks = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return tasks.slice(startIndex, startIndex + itemsPerPage);
  }, [tasks, currentPage]);

  const goToPreviousPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const calculateRange = () => {
    if (tasks.length === 0) return "0-0 מתוך 0";
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, tasks.length);
    return `${startIndex}-${endIndex} מתוך ${tasks.length} משובים`;
  };

  return (
    <div>
      <div className={style["feedbacksWarp"]}>
        {paginatedTasks.length > 0 ? (
          paginatedTasks.map((feedback: any, index: number) => (
            <TempleteFeedback
              key={`${index}`}
              taskId={feedback.taskId}
              feedbackTitle={feedback.feedback?.name}
              answersCount={feedback.countOfAnswers}
              assignmentsCount={feedback.countOfAssignments}
              taskDate={feedback.assignments}
              taskName={feedback.taskName}
            />
          ))
        ) : (
          <h1>לא שובצו משובים לצוות זה</h1>
        )}
      </div>
      <div className={style["paginationsDiv"]}>
        {tasks.length > 0 && (
          <>
            <Button
              icon={<RightOutlined />}
              disabled={currentPage === totalPages}
              onClick={goToNextPage}
            />
            <span>{calculateRange()}</span>
            <Button
              icon={<LeftOutlined />}
              disabled={currentPage === 1}
              onClick={goToPreviousPage}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default FeedBackDashByTeam;