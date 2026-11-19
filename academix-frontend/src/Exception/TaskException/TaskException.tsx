import React, { useEffect, useState } from "react";
import style from "./TaskException.module.css";
import TeamDelyas from "../TeamDelyas/TeamDelyas";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer } from "recharts";
import {
  COLORS,
  getGradeStageProgressByTeam,
  getOpenFeedbackBySemester,
  getOpenFeedbackByTeam,
  getTasksBySemester,
  getTasksByTeam,
} from "../../services/ApiServices";
import CertificationSteps from "../CertificationSteps/CertificationSteps";
import ChartBar from "../CertificationSteps/ChartBar/ChartBar";
import { useGetGradeStageProgress } from "../../hooks/useGetGradeStageProgress";
import { divide } from "lodash";
import { useLocation } from "react-router-dom";
import { useSelectionsStore } from "../../store/selectionStore";

type Mode = "certification" | "tasks" | "feedbacks";

type Props = {
  teamIds?: Number[];
  teamId?: Number;
};

const TaskException = (props: Props) => {
  const [mode, setMode] = useState<Mode>("tasks");
  const [chooseGradeStage, setChooseGradeStage] = useState<Number>();
  const [chooseGradeStageForSoldiers, setChooseGradeStageForSoldiers] =
    useState<Number>();
  const [chooseDataForCandles, setChooseDataForCandles] = useState<any>();
  const [soldiersDataForCandles, setSoldiersDataForCandles] = useState<any[]>(
    []
  );
   const { selectedCourseBatch } = useSelectionsStore();


  const [missionData, setMissionData] = useState<any[]>([]);
  const [teamData, setTeamData] = useState<any[]>([]);
  const [certificationSoldiersData, setCertificationSoldiersData] = useState<
    any[]
  >([]);
  const [feedbackData, setFeedbackData] = useState<any[]>([]);
  const location = useLocation();
  const currentUrl = location.pathname;

  const {
    data: task,
    isLoading,
    isError,
  } = useGetGradeStageProgress(props.teamIds!!);


  
  useEffect(() => {
    if (task && task.length > 0) {
      setChooseGradeStage(task[0].gradeStageId),
        setChooseDataForCandles(task[0].teams);
    }
  }, [task]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (props.teamId) {
          const teamData = await getGradeStageProgressByTeam(props.teamId!!,selectedCourseBatch.id);
          if (teamData && teamData.length > 0) {
            setSoldiersDataForCandles(teamData[0].soldiers);
            setCertificationSoldiersData(teamData);
            setChooseGradeStageForSoldiers(teamData[0].gradeStageId);
          }
        }

        let feedbacks;
        if (props.teamIds && props.teamIds.length > 0) {
          feedbacks = await getOpenFeedbackBySemester(props.teamIds,selectedCourseBatch.id);
        } else if (props.teamId) {
          feedbacks = await getOpenFeedbackByTeam(props.teamId,selectedCourseBatch.id);
        } else {
          feedbacks = {};
        }
const feedbacksArray = Array.isArray(feedbacks) ? feedbacks : [];
const feedbacksWithColor = feedbacksArray.map(
  (feedback: any, index: any) => ({
    ...feedback,
    color: COLORS[index % COLORS.length],
  })
);
        setFeedbackData(feedbacksWithColor);
        let response;
        if (props.teamIds && props.teamIds.length > 0) {
          response = await getTasksBySemester(props.teamIds,selectedCourseBatch?.id);
         
        } else if (props.teamId) {
          response = await getTasksByTeam(props.teamId, selectedCourseBatch?.id);
        } else {
          response = {};
        }

        ///////////////////////שינוי מIF למעלה תלוי COMPLETED_AT לא למחוק!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        // if (props.teamIds && props.teamIds.length > 0) {
        //   console.log(response);
        //   const grouped = response.reduce((acc: any[], task: any) => {
        //     const teamName = task.Team?.name || `משימה ${task.task_id}`;
        //     const existing = acc.find((item: any) => item.name === teamName);
        //     const isValid =
        //       task.timeSinceEnd &&
        //       (task.timeSinceEnd.days !== null ||
        //         task.timeSinceEnd.hours !== null);
        //     if (existing) {
        //       if (isValid) {
        //         existing.value++;
        //       }
        //     }
        //     else {
        //       acc.push({ name: teamName, value: isValid ? 1 : 0 });
        //     }
        //     return acc;
        //   }, []);
        //   console.log(grouped);

        //   setMissionData(grouped);
        // }

        ///////////////////////שינוי מIF למעלה תלוי COMPLETED_AT לא למחוק!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        if (props.teamIds && props.teamIds.length > 0) {
          const grouped = response.reduce((acc: any[], task: any) => {
            const teamName = task.Team?.name || `משימה ${task.task_id}`;
            const existing = acc.find((item: any) => item.name === teamName);

            // const isValid = task.completed_at === null;
 // בדיקה: לא הושלם + התאריך עבר
    const deadlinePassed = task.end && new Date(task.end) < new Date();

    
    const isValid = task.completed_at === null && deadlinePassed;
            if (existing) {
              if (isValid) {
                existing.value++;
              }
            } else {
              acc.push({ name: teamName, value: isValid ? 1 : 0 });
            }
            return acc;
          }, []);
          setMissionData(grouped);
        } 
        else if (props.teamId) {
          setTeamData(response);
        }
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }
    };
    fetchData();
  }, [props]);
  return (
    <div
      className={style["container"]}
      style={
        currentUrl === "/dashboard/team"
          ? { width: "28vw", height: "26vh" }
          : {}
      }
    >
      <div className={style["headerDiv"]}>
        <div>
          <h3 style={{ color: "#6E7072", fontSize: "20px", margin: 0 }}>
            {mode === "tasks"
              ? "חריגות במשימות"
              : mode === "feedbacks"
              ? "חריגות במשובים"
              : "חריגות בשלבי הסמכה "}
          </h3>
        </div>

        <div>
          <div className={style["imporveDiv"]}>
            <div
              onClick={() => setMode("certification")}
              className={style["imporveText"]}
              style={{
                backgroundColor: mode === "certification" ? "white" : "",
                color: mode !== "certification" ? "white" : "",
              }}
            >
              שלבי הסמכה
            </div>
            <div
              onClick={() => setMode("feedbacks")}
              className={style["imporveText"]}
              style={{
                backgroundColor: mode === "feedbacks" ? "white" : "",
                color: mode !== "feedbacks" ? "white" : "",
              }}
            >
              משובים
            </div>
            <div
              onClick={() => setMode("tasks")}
              className={style["imporveText"]}
              style={{
                backgroundColor: mode === "tasks" ? "white" : "",
                color: mode !== "tasks" ? "white" : "",
              }}
            >
              משימות
            </div>
          </div>
        </div>
      </div>

      {mode === "tasks" && (
        <div className={style["chartsContainer"]}>
          <div className={style.teams}>
            {missionData &&
              missionData.map((m, i) => (
                <TeamDelyas
                  key={m.name}
                  name={m.name}
                  value={m.value}
                  color={COLORS[i]}
                />
              ))}
            {teamData &&
              teamData.map((m, i) => (
                <TeamDelyas
                  key={m.name}
                  name={m.name}
                  value={m.value}
                  color={COLORS[i]}
                />
              ))}
          </div>
   <ResponsiveContainer width="50%" height={250} className={style["chart-container"]}>
            <PieChart>
              <Pie
                data={missionData.length > 0 ? missionData : teamData}
                cx="50%"
                cy="30%"
                outerRadius={70}
                // innerRadius={"40%"}
                dataKey="value"
                nameKey="name"
                style={{ outline: "none" }}
                label={false}
              >
                {missionData.length > 0 &&
                  missionData?.map((_, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                {teamData.length > 0 &&
                  teamData?.map((_, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
              </Pie>
              {/* <Legend /> */}
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
      {mode === "certification" && (
        <div className={style["chartsContainer"]}>
          <div className={style.teams}>
            {task &&
              task.map((t: any, i: any) => (
                <CertificationSteps
                  name={t.gradeStageName}
                  changeMode={() => {
                    setChooseGradeStage(t.gradeStageId),
                      setChooseDataForCandles(t.teams);
                  }}
                  backgroundColor={
                    chooseGradeStage === t.gradeStageId
                      ? "#d4c7ad"
                      : "rgba(244, 241, 235, 1)"
                  }
                />
              ))}

            {certificationSoldiersData &&
              certificationSoldiersData.map((t: any, i: any) => (
                <CertificationSteps
                  name={t.gradeStageName}
                  changeMode={() => {
                    setChooseGradeStageForSoldiers(t.gradeStageId),
                      setSoldiersDataForCandles(t.soldiers);
                  }}
                  backgroundColor={
                    chooseGradeStageForSoldiers === t.gradeStageId
                      ? "#d4c7ad"
                      : "rgba(244, 241, 235, 1)"
                  }
                />
              ))}
          </div>
          <div className={style.chartWrapper}>
            <ChartBar
              {...(props.teamIds && props.teamIds.length > 0
                ? { chooseDataForCandles: chooseDataForCandles }
                : { soldiersDataForCandles: soldiersDataForCandles })}
            />
          </div>
        </div>
      )}
      {mode === "feedbacks" ? (
        <div className={style["chartsContainer"]}>
          <div className={style.teams}>
            {feedbackData &&
              feedbackData.map((m, i) => (
                <CertificationSteps
                  key={m.name}
                  name={m.name}
                  value={m.count ?? m.value}
                  color={m.color}
                />
              ))}
          </div>
          <div className={style.chartWrapper}>
            {<ChartBar feedbackData={feedbackData} />}
          </div>
        </div>
      ) : (
        <div></div>
      )}
    </div>
  );
};
export default TaskException;
