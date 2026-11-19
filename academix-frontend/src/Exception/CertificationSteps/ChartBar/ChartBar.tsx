import { Empty } from "antd";
import React from "react";
import {
  Bar,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  BarChart,
  LabelList,
  Tooltip,
} from "recharts";
import style from './ChartBar.module.css'
import { InboxOutlined } from "@ant-design/icons";
type Props = {
  chooseDataForCandles?: any;
  feedbackData?: any;
  color?: any;
  soldiersDataForCandles?: any;
  assignmemtData?:any
};

const ChartBar = (props: Props) => {
  const randomColor = () => {
    const color =
      "#" +
      Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, "0");
    return color;
  };

  const realData = (() => {
    if (props.chooseDataForCandles && props.chooseDataForCandles.length > 0) {
      return props.chooseDataForCandles.map((t: any) => ({
        name: t.teamName,
        value:
          t.totalSoldiers === 0 || t.completedCount === 0
            ? 1
            : (t.completedCount / t.totalSoldiers) * 100,
        color: randomColor(),
      }));
    }

    if (
      props.soldiersDataForCandles &&
      props.soldiersDataForCandles.length > 0
    ) {
      const flatData: any[] = [];

      props.soldiersDataForCandles.forEach((soldier: any) => {
        if (soldier) {
          flatData.push({
            name: soldier.userName || "ללא שם",
            value: soldier.completionPercentage || 1,
            color: randomColor(),
          });
        }
      });

      return flatData;
    }
    if (props.feedbackData && props.feedbackData.length > 0) {
      return props.feedbackData.map((f: any) => ({
        name: f.name,
        value: f.count ?? f.value,
        color: f.color,
      }));
    } else if (props.assignmemtData && props.assignmemtData.length > 0) {
      return props.assignmemtData.map((f: any) => ({
        name: f.name,
        value: f.completedTasks,
        color: f.color,
      }));
    }
    return [];
  })();

  const showPercentage =
    (props.chooseDataForCandles && props.chooseDataForCandles.length > 0) ||
    props.soldiersDataForCandles;
const needsScroll = realData.length > 7;
  if (realData.length === 0) {
    return(
      <div className={style.emptyContainer}>
      <div className={style.emptyIcon}>
        <InboxOutlined />
      </div>
      <h3 className={style.emptyTitle}>אין נתונים</h3>
      <p className={style.emptyText}>אין פריטים להצגה כרגע</p>
    </div>
    ) 
    ;
  }

  return (
    <div style={{
        width: "100%",
        overflowX: needsScroll ? "auto" : "hidden",
        overflowY: "hidden",
      }} className={style["chart-container"]}>
      <ResponsiveContainer width={"100%"} height={180} style={{ outline: "none" }} >
        <BarChart data={realData} style={{ outline: "none" }}  
        >
          <XAxis 
          width={needsScroll ? realData.length * 60 : "100%"}
            dataKey="name"
            axisLine={false}
            tickLine={false}
            padding={{ left: 25 }}
            tick={{ fontSize: 9 }}
            // tick={false}
            interval={0}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            domain={[0, showPercentage ? 100 : 7]}
            tickFormatter={(value) =>
              showPercentage ? `${value}%` : `${value}`
            }
          />
          <Tooltip
            formatter={(value: any) => [
              parseInt(value) ,
              showPercentage ? "אחוז השלמה" : "כמות",
            ]}
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #ccc",
              borderRadius: "5px",
              fontSize: "12px",
            }}
            labelStyle={{ color: "#333" }}
          />
          <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={15}>
            {/* <LabelList dataKey="value" position="top" /> */}
            {realData.map((entry: any, index: any) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ChartBar;
