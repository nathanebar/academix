import { useState } from "react";
import Photo from "../../../../../UI/Photo/Photo";
import style from "./SurveyMatrixQuestion.module.css";
import { ConfigProvider, Select } from "antd";
type QuestionsProps = {
  question: any;
  questionData: any;
};
const SurveyMatrixQuestion = ({ question, questionData }: QuestionsProps) => {
  const [selectedMember, setSelectedMember] = useState<string>("all");
  const allTeamMembers = questionData || [];
  // Get unique members for dropdown
  const uniqueMembers = allTeamMembers.map((member: any) => ({
    username: member.username,
    name: member.name,
  }));
  // Group answers by combination
  const groupedAnswers: any = {};
  allTeamMembers.forEach((member: any) => {
    const matchingQuestion = member?.questions?.find(
      (q: any) => q.questionId === question?.id
    );
    matchingQuestion?.answers?.forEach((answer: any) => {
      const key = `${answer.left_option?.id}-${answer.right_option?.id}`;
      if (!groupedAnswers[key]) {
        groupedAnswers[key] = {
          leftOption: answer.left_option,
          rightOption: answer.right_option,
          members: [],
        };
      }
      groupedAnswers[key].members.push({
        username: member.username,
        name: member.name,
      });
    });
  });
  let uniqueAnswers = Object.values(groupedAnswers).sort(
    (a: any, b: any) => b.members.length - a.members.length
  );
  // Filter by selected member if not "all"
  if (selectedMember !== "all") {
    uniqueAnswers = uniqueAnswers
      .map((answer: any) => ({
        ...answer,
        members: answer.members.filter(
          (m: any) => m.username === selectedMember
        ),
      }))
      .filter((answer: any) => answer.members.length > 0);
  }

  // Prepare options for Ant Design Select
  const memberOptions = [
    { value: "all", label: "כל החניכים" },
    ...uniqueMembers.map((member: any) => ({
      value: member.username,
      label: member.name,
    })),
  ];

  return (
    <ConfigProvider
      theme={{
        components: {
          Select: {
            colorBgContainer: "rgba(244, 241, 235, 1)",
            activeBorderColor: "rgba(244, 241, 235, 1);",
            hoverBorderColor: "rgba(244, 241, 235, 1);",
            colorBorder: "rgba(244, 241, 235, 1)",
            borderRadius: 10,
          },
        },
      }}
    >
      <div className={style.mainDiv}>
        <div className={style.centerDiv}>
          <div className={style.questionDiv}> מתח קו בין המילים </div>
          <div style={{ display: "flex", height: "100%" }}>
            <div className={style.answersContainer}>
              {uniqueAnswers.map((answer: any, index: number) => (
                <div key={index} className={style.answerRow}>
                  <div className={style.optionsRow}>
                    <div className={style.optionDiv}>
                      {answer.leftOption?.option_text}
                    </div>
                    <div className={style.arrow}>←→</div>
                    <div className={style.optionDiv}>
                      {answer.rightOption?.option_text}
                    </div>
                  </div>
                  <div className={style.photosRow}>
                    {answer.members.map((member: any, i: number) => (
                      <Photo
                        key={i}
                        username={member.username}
                        title={member?.name}
                        style={{
                          width: "2rem",
                          height: "2rem",
                          cursor: "pointer",
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className={style.filterContainer}>
              <Select
                value={selectedMember}
                onChange={(value) => setSelectedMember(value)}
                options={memberOptions}
                style={{ width: 200, height: "4vh", borderRadius: "20px" }}
                placeholder="בחר חניך"
              />
            </div>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
};
export default SurveyMatrixQuestion;
