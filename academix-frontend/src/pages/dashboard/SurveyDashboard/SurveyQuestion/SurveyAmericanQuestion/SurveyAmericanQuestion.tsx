import { Cell, Legend, Pie, PieChart, Tooltip } from "recharts";
import style from "./SurveyAmericanQuestion.module.css";
import { useState } from "react";
type QuestionsProps = {
  question: any;
  questionData: any;
};
const COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4"];

const SurveyAmericanQuestion = ({ question, questionData }: QuestionsProps) => {
  const [hoveredOptionId, setHoveredOptionId] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const allTeamMembers = questionData || [];
  const teamMembersWithAnswers = allTeamMembers?.filter((member: any) => {
    const matchingQuestion = member?.questions?.find(
      (q: any) => q.questionId === question?.id
    );
    const hasAnswer = matchingQuestion?.answers?.[0]?.selected_option;
    return hasAnswer;
  });

  const optionCounts = question?.FormOptions?.map(
    (option: any, index: number) => {
      const count = teamMembersWithAnswers?.filter((member: any) => {
        const matchingQuestion = member?.questions?.find(
          (q: any) => q.questionId === question?.id
        );
        return (
          matchingQuestion?.answers?.[0]?.selected_option?.id === option.id
        );
      }).length;
      return {
        ...option,
        count,
        color: COLORS[index % COLORS.length],
      };
    }
  );

  const getVoters = (optionId: number) => {
    return teamMembersWithAnswers
      ?.filter((member: any) => {
        const matchingQuestion = member?.questions?.find(
          (q: any) => q.questionId === question?.id
        );
        return matchingQuestion?.answers?.[0]?.selected_option?.id === optionId;
      })
      ?.map((member: any) => member.name);
  };

  const pieData = optionCounts?.map((option: any) => ({
    name: option.option_text,
    value: option.count,
    color: option.color,
  }));

  // Calculate total answers for percentage
  const totalAnswers = teamMembersWithAnswers?.length;

  const handleMouseEnter = (e: React.MouseEvent, optionId: number) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setTooltipPosition({ x: rect.left + rect.width / 2, y: rect.top });
    setHoveredOptionId(optionId);
  };

  const handleMouseLeave = () => {
    setHoveredOptionId(null);
  };

  return (
    <div className={style.mainDiv}>
      <div className={style.centerDiv}>
        <div className={style.questionDiv}>{question?.question_text}</div>
        <div className={style.statisticsDiv}>
          <div className={style.optionsContainer}>
            {optionCounts?.map((option: any, index: number) => (
              <div style={{ display: "flex", alignItems: "center" }}>
                <div
                  className={style.dot}
                  style={{ backgroundColor: option.color }}
                />
                <div key={index} className={style.optionDiv}>
                  <span className={style.optionText}>{option.option_text}</span>
                  <div className={style.precentDiv}>
                    <span
                      className={style.countBadge}
                      style={{ backgroundColor: option.color }}
                      onMouseEnter={(e) => handleMouseEnter(e, option.id)}
                      onMouseLeave={handleMouseLeave}
                    >
                      {option.count}
                    </span>
                    <span style={{ fontWeight: 600 }}>
                      {totalAnswers > 0
                        ? Math.round((option.count / totalAnswers) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                  {hoveredOptionId === option.id && (
                    <div
                      style={{
                        position: "fixed",
                        left: tooltipPosition.x,
                        top: tooltipPosition.y - 10,
                        transform: "translate(-50%, -100%)",
                        backgroundColor: "white",
                        padding: "8px",
                        borderRadius: "8px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                        zIndex: 1000,
                        minWidth: "100px",
                        fontSize: "15px",
                      }}
                    >
                      <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                        מצביעים:
                      </div>
                      {getVoters(option.id).length > 0 ? (
                        getVoters(option.id)?.map((name: string, i: number) => (
                          <div key={i}>{name}</div>
                        ))
                      ) : (
                        <div style={{ color: "#999" }}>אין מצביעים</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className={style.pieDiv}>
            <PieChart width={300} height={300}>
              <Pie
                style={{ outline: "none" }}
                data={pieData}
                outerRadius={100}
                innerRadius={65}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
                animationDuration={800}
                animationBegin={0}
              >
                {pieData?.map((item: any, index: any) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={item.color}
                    style={{ cursor: "pointer" }}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [
                  <div key="tooltip" style={{ padding: "5px" }}>
                    <div style={{ fontWeight: "bold" }}>
                      {value} - {name}
                    </div>
                  </div>,
                ]}
                contentStyle={{
                  border: "none",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  borderRadius: "8px",
                  padding: "8px",
                  backgroundColor: "white",
                  fontSize: "12px",
                }}
              />
            </PieChart>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SurveyAmericanQuestion;
