import React, { useEffect, useState } from "react";
import CardUI from "../../UI/Card/Card";
import style from "./studentsTeamManager.module.css";
import Photo from "../../UI/Photo/Photo";
import { Button } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import Title from "./Title";
type Props = {
  students: {
    fullname: string;
    militaryId: string;
    team: string;
    tasksPerformed: number;
    TasksForReview: number;
    irregularity: string;
  }[];
};

function StudentsTeamManager(props: Props) {
  const [students, setStudents] = useState<
    {
      fullname: string;
      militaryId: string;
      team: string;
      tasksPerformed: number;
      TasksForReview: number;
      irregularity: string;
    }[]
  >([]);
  useEffect(() => {
    setStudents(props.students);
  }, [props.students]);
  return (
    <div>
      {" "}
      <CardUI
        width={"37.5vw"}
        height={"36.388888888888886vh"}
        title={<Title studentsLength={students.length} />}
        style={{ padding: "1.9791666666666667vw 32px" }}
        bodyStyle={{ paddingTop: 0 }}
      >
        <div className={style["body"]}>
          {[
            "",
            "שם מלא",
            "מספר אישי",
            "צוות",
            "בוצעו השבוע",
            "ממתין לבדיקה",
            "חריגה",
            "",
          ].map((row, index) => (
            <>
              <text
                style={
                  index === 0 ? { border: "none", width: "2vw" } : undefined
                }
                className={style["col"]}
              >
                {row}
              </text>
            </>
          ))}
          {students.map((student) => (
            <>
              {" "}
              <Photo username={student.militaryId} />
              {Object.values(student).map((field) => (
                <text className={style["col"]}>{field}</text>
              ))}{" "}
              <Button></Button>{" "}
            </>
          ))}
        </div>
      </CardUI>
    </div>
  );
}

export default StudentsTeamManager;
