import style from "./AxesCard.module.css";
import { ConfigProvider, Progress, Tooltip } from "antd";
import { useTaskCount } from "../../../hooks/useFetchTaskCount";
import { schemaMap, SchemaName } from "../../../types/types";
import { useSelectionsStore } from "../../../store/selectionStore";
import { useLocation } from "react-router-dom";
interface MissionTooltipProps {
  completed: number;
  total: number;
  percent: number;
  color?: string;
}
type Props = {
  axesName: string;
  index: number;
  color: string;
  totalTaskAssignments: number;
  missionCount: number;
  completedPercent: number;
  completedTaskCount: number;
};
const AxesCard = (props: Props) => {
  const gradient =
    props.index !== undefined
      ? schemaMap[props.color as SchemaName]
      : schemaMap["coral"];
  const backgroundColor = `linear-gradient(135deg, ${gradient?.from}, ${gradient?.to})`;

  const CircularMissionTooltip = ({
    completed,
    total,
    percent,
    color,
  }: MissionTooltipProps) => {
    return (
      <div
        style={{
          padding: "16px",
          textAlign: "center",
          minWidth: "200px",
          backgroundColor: "#1f1f2e",
        }}
      >
        <div
          style={{
            color: "#fff",
            fontWeight: "bold",
            marginBottom: "16px",
            fontSize: "14px",
          }}
        >
          התקדמות משימות
        </div>
        <Progress
          type="circle"
          percent={percent}
          size={80}
          strokeColor={color || "#52c41a"}
          trailColor="rgba(255,255,255,0.15)"
          format={(percent) => (
            <span
              style={{
                color: "#fff",
                fontSize: "18px",
                fontWeight: "bold",
              }}
            >
              {percent}%
            </span>
          )}
        />
        <div
          style={{
            marginTop: "16px",
            color: "rgba(255,255,255,0.8)",
            fontSize: "13px",
          }}
        >
          {completed} משימות הושלמו מתוך {total}  ששובצו
        </div>

        <div
          style={{
            marginTop: "12px",
            display: "flex",
            justifyContent: "center",
            gap: "24px",
            fontSize: "12px",
          }}
        >
          <div>
            <div style={{ color: "#52c41a" }}>✅ הושלמו</div>
            <div style={{ color: "#fff", fontWeight: "bold" }}>{completed}</div>
          </div>
          <div>
            <div style={{ color: "#faad14" }}>🔄 בתהליך</div>
            <div style={{ color: "#fff", fontWeight: "bold" }}>
              {total - completed}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ConfigProvider
      theme={{
        components: {
          Progress: {
            colorText: "white",
          },
        },
      }}
    >
      <div
        className={style["container"]}
        style={{
          background: backgroundColor,
        }}
      >
        <div className={style["axesNameDiv"]}>
          <Tooltip title={"מס' תרגילים"}>
            <p
              style={{ fontSize: "large", fontWeight: "bold", color: "white" }}
            >
              {props?.missionCount}
            </p>
          </Tooltip>
          <p className={style["axesNameP"]} style={{ whiteSpace: "nowrap" }}>
            {props.axesName}
          </p>
        </div>
        <div
          style={{
            paddingLeft: "10px",
            alignContent: "center",
            fontSize: "xx-large",
            color: "black",
          }}
        >
          <div className={style["precentDiv"]}>
            <Progress
              type="circle"
              strokeWidth={7}
              strokeColor={"white"}
              trailColor="rgba(255, 255, 255, 0.500)"
              format={(percent) => (
                <Tooltip
                  title={
                    <CircularMissionTooltip
                      completed={props.completedTaskCount}
                      total={props.totalTaskAssignments}
                      percent={props.completedPercent}
                      color={props.color}
                    />
                  }
                >
                  <div style={{ color: "black" }}>
                    <span style={{ fontSize: "13px", fontWeight: "bold" }}>
                      {props.completedPercent}
                    </span>
                    <span style={{ fontSize: "x-small" }}>%</span>
                  </div>
                </Tooltip>
              )}
            />
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default AxesCard;
