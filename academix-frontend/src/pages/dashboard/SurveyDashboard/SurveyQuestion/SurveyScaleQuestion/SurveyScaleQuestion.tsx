import { Tooltip } from "antd";
import Photo from "../../../../../UI/Photo/Photo";
import style from "./SurveyScaleQuestion.module.css";
type QuestionsProps = {
  question: any;
  questionData: any;
};
const SurveyScaleQuestion = ({ question, questionData }: QuestionsProps) => {

  const formOptions = question?.FormOptions || [];
  const orderIndexes = formOptions
    .map((opt: any) => opt.orderIndex)
    .filter((order: number) => order != null)
    .sort((a: number, b: number) => a - b);

  const minOrderIndex = orderIndexes.length > 0 ? Math.min(...orderIndexes) : 1;
  const maxOrderIndex =
    orderIndexes.length > 0 ? Math.max(...orderIndexes) : 10;

  const allNumbers = Array.from(
    { length: maxOrderIndex - minOrderIndex + 1 },
    (_, i) => minOrderIndex + i
  );

  let numbersToDisplay;
  if (allNumbers.length <= 10) {
    numbersToDisplay = [...allNumbers];
  } else {
    const totalNumbers = allNumbers.length;
    const step = (totalNumbers - 1) / 9;
    numbersToDisplay = Array.from({ length: 10 }, (_, i) => {
      const index = Math.round(i * step);
      return allNumbers[index];
    });
  }

  numbersToDisplay = numbersToDisplay.reverse();

  const labelHeight = 100 / numbersToDisplay.length;

  const allTeamMembers = questionData || [];
  const membersWithScale = allTeamMembers?.filter((member: any) => {
    const matchingQuestion = member?.questions?.find(
      (q: any) => q.questionId === question?.id
    );
    return matchingQuestion?.answers?.[0]?.value_number != null;
  });
  const membersWithRatings = membersWithScale?.map((member: any) => {
    const matchingQuestion = member?.questions?.find(
      (q: any) => q.questionId === question?.id
    );
    return {
      ...member,
      rating: matchingQuestion?.answers?.[0]?.value_number,
    };
  });
  const totalRatings = membersWithScale?.length;
  const sumRatings = membersWithRatings?.reduce(
    (sum: number, member: any) => sum + member.rating,
    0
  );
  return (
    <div className={style.mainDiv}>
      <div className={style.centerDiv}>
        <div className={style.questionDiv}>{question?.question_text}</div>
        <div className={style.scaleWrapper}>
          <div className={style.scaleContainer}>
            <div className={style.scaleNumbers}>
              {/* תצוגת המספרים - מקסימום למעלה, מינימום למטה */}
              {numbersToDisplay.map((num) => (
                <div
                  key={num}
                  className={style.numberLabel}
                  style={{ height: `${labelHeight}%`}}
                >
                  {num}
                </div>
              ))}
            </div>
            <div className={style.barsContainer}>
              {membersWithRatings?.map((member: any) => (
                <Tooltip title={member?.rating} placement="right">
                  <div
                    key={member.task_assignment_id}
                    className={style.memberBar}
                    style={{
                      height: `${
                        ((member.rating - minOrderIndex) /
                          (maxOrderIndex - minOrderIndex)) *
                        100
                      }%`,
                    }}
                  />
                </Tooltip>
              ))}
            </div>
          </div>
          <div className={style.photosContainer}>
            {membersWithRatings?.map((member: any) => (
              <div key={member.task_assignment_id} className={style.photoDiv}>
                <Photo
                  username={member?.username}
                  title={member?.name}
                  style={{
                    width: "2.5rem",
                    height: "2.5rem",
                    cursor: "pointer",
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default SurveyScaleQuestion;
