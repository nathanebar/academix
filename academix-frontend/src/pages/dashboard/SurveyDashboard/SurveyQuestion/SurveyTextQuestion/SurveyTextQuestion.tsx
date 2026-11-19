import style from "./SurveyTextQuestion.module.css";
import Photo from "../../../../../UI/Photo/Photo";

type QuestionsProps = {
  question: any;
  questionData: any;
};

const SurveyTextQuestion = ({ question, questionData }: QuestionsProps) => {
  const allTeamMembers = questionData || [];
  const teamMembersWithAnswers = allTeamMembers?.filter((member: any) => {
    const matchingQuestion = member?.questions?.find(
      (q: any) => q.questionId === question?.id
    );
    const hasAnswer = matchingQuestion?.answers?.[0]?.value_text;
    return hasAnswer;
  });

  return (
    <div className={style.mainDiv}>
      <div className={style.centerDiv}>
        <div className={style.questionDiv}>{question?.question_text}</div>
        <div className={style.answersDiv}>
          {teamMembersWithAnswers?.map((member: any, index: number) => {
            const matchingQuestion = member?.questions?.find(
              (q: any) => q.questionId === question?.id
            );
            const answerText = matchingQuestion?.answers?.[0]?.value_text;

            return (
              <div key={index} className={style.personDiv}>
                <Photo
                  username={member?.username}
                  title={member?.name}
                  style={{
                    width: "3rem",
                    height: "3rem",
                    cursor: "auto",
                  }}
                />
                <div className={style.textDiv}>{answerText}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SurveyTextQuestion;
