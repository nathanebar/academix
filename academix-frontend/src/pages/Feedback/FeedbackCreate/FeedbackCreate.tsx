import React, { useEffect, useRef, useState } from "react";
import {
  createFeedback,
  getFeedbackByFeedbackId,
  updateFeedaback,
} from "../../../services/ApiServices";
import { Button, Radio, Tooltip, notification, Spin, Switch, Tag } from "antd";
import style from "./FeedbackCreate.module.css";
import RegularInput from "../../../UI/Input/Input/RegularInput";
import {
  CloseOutlined,
  ApartmentOutlined,
  InfoCircleOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import BlackButton from "../../../UI/Button/BlackButton";
import { useSelectionsStore } from "../../../store/selectionStore";
import Notification from "../../../UI/Notification/Notification";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { usePermissionStore } from "../../../store/permissionStore";
import { useQueryClient } from "@tanstack/react-query";
import { isUnique } from "../../../utils/checkCategoriesDuplicate";
import { ROLE_CODE } from "../../../types/types";
import { isEqual } from "lodash";

const ABOVE_TEAM_COMMANDER_ROLES: ROLE_CODE[] = [
  "COURSE_COMMANDER",
  "DOMAIN_MANAGER",
  "DEVELOPER",
  "SYSTEM-ADMIN",
  // "OVERLAP",
];

const isAboveTeamCommander = (roleCode: ROLE_CODE | undefined): boolean => {
  if (!roleCode) return false;
  return ABOVE_TEAM_COMMANDER_ROLES.includes(roleCode);
};

const canUserCreateFeedback = (roleCode: ROLE_CODE | undefined): boolean => {
  if (!roleCode) return false;
  return true;
};

const canUserEditFeedback = (
  feedbackTeamId: number | null,
  userAllowedTeamIds: number[],
  roleCode: ROLE_CODE | undefined
): boolean => {
  if (!roleCode) return false;

  if (isAboveTeamCommander(roleCode)) return true;

  if (roleCode === "TEAM_COMMANDER" || roleCode === "OVERLAP") {
    if (feedbackTeamId === null) return false;
    return userAllowedTeamIds.includes(feedbackTeamId);
  }

  return false;
};

interface FeedbackCreateProps {
  mode?: "view" | "edit";
}

const FeedbackCreate = (props: FeedbackCreateProps) => {
  const location = useLocation();
  const { feedbackId } = useParams<{ feedbackId: string }>();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [feedbackName, setFeedbackName] = useState<string>("");
  const [catagoryComment, setCatagoryComment] = useState<string>("");
  const [categories, setCategories] = useState<string[]>(["", ""]);
  const [selectedOption, setSelectedOption] = useState<number | null>(0);
  const [selectedOptionGrade, setSelectedOptionGrade] = useState<number | null>(
    1
  );
  const [selectedLevel, setSelectedLevel] = useState<number | null>(0);
  const [questions, setQuestions] = useState<string[]>([""]);
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);
  const [newQuestion, setNewQuestion] = useState<string>("");
  const [newCategory, setNewCategory] = useState<string>("");
  const [teamName, setTeamName] = useState<string | null>(null);
  const [courseName, setCourseName] = useState<string | null>(null);

  const [feedbackTeamId, setFeedbackTeamId] = useState<number | null>(null);
  const [teamScope, setTeamScope] = useState<"team" | "course">("team");
  const [dataLoaded, setDataLoaded] = useState(false);
  const [seenGradeToUser, setSeenGradeToUser] = useState<boolean>(false);

  const originalRef = useRef<any | null>(null);
  const selectedPermission = usePermissionStore(
    (state) => state.selectedPermission
  );
  const { selectedCourse, selectedTeam } = useSelectionsStore();
  const queryClient = useQueryClient();
  const isView = props.mode === "view";
  const isEdit = props.mode === "edit";
  const isCreate = !isEdit && !isView;
  const buttonLabel = isEdit ? "עדכון משוב" : "שמור משוב";
  const navigate = useNavigate();
  const isHigherThanTeamCommander = isAboveTeamCommander(
    selectedPermission?.role_code
  );
  const canCreateCurrentFeedback = canUserCreateFeedback(
    selectedPermission?.role_code
  );



  const canEditCurrentFeedback = canUserEditFeedback(
    feedbackTeamId,
    selectedPermission?.allowedTeamIds || [],
    selectedPermission?.role_code
  );

  const hasPermission = isCreate
    ? canCreateCurrentFeedback
    : isEdit
      ? canEditCurrentFeedback
      : true;



  const baseTeamId =
    selectedTeam?.id || selectedPermission?.allowedTeamIds?.[0];
  const isFieldDisabled = isView || (isEdit && !canEditCurrentFeedback);

  const showNoPermissionMessage =
    (isEdit || isView) &&
    selectedPermission?.role_code === "TEAM_COMMANDER" &&
    feedbackTeamId === null;

  const gradeToOptionAndLevel = (grade: number | null) => {
    if (grade === null) return { option: 0, level: 0 };
    if (grade === 10) return { option: 3, level: 0 };
    const ratingType = Math.ceil(grade / 3);
    const level = grade - (ratingType - 1) * 3;
    const option = ratingType - 1;
    return { option, level };
  };

  useEffect(() => {
    if (!feedbackId) {
      setDataLoaded(true);
      return;
    }

    const fetchFeedbackInfo = async () => {
      try {
        setLoading(true);
        setDataLoaded(false);
        const result = await getFeedbackByFeedbackId(Number(feedbackId));
        if (!result.success) {
          notification.error({ message: "שגיאה", description: result.error });
          setDataLoaded(true);
          return;
        }
        const info = result.data;
        setSeenGradeToUser(info.data.seenGrade ?? false);
        setFeedbackTeamId(info.data?.team_id ?? null);
        setFeedbackName(info.data?.name ?? "");
        setCatagoryComment(info.data?.categoryComment ?? "");

        const catNames = (info.data?.categories ?? []).map(
          (c: any) => c.category ?? ""
        );
        setCategories(catNames.length ? catNames : ["", ""]);

        const qTexts = (info.data?.questions ?? []).map(
          (q: any) => q.question_text ?? ""
        );
        setQuestions(qTexts.length ? qTexts : [""]);

        const grade = info.data?.select_option_score ?? null;
        setSelectedOptionGrade(grade);
        const { option, level } = gradeToOptionAndLevel(grade);
        setSelectedOption(option);
        setSelectedLevel(level);

        setTeamName(info.data?.team?.name);
        setCourseName(info.data?.Course?.name);
        setTeamScope(info.data?.team_id === null ? "course" : "team");

        const payloadRef = {
          name: (info.data.name ?? "").trim(),
          select_option_score: grade,
          categoryComment: info.data.categoryComment ?? "",
          is_active: true,
          categories: (info.data.categories ?? [])
            .filter((c: any) => c?.category?.trim())
            .map((c: any) => ({ category: c.category.trim() })),
          questions: (info.data.questions ?? [])
            .filter((q: any) => q?.question_text?.trim())
            .map((q: any) => ({ question_text: q.question_text.trim() })),
          team_id: info.data?.team_id,
          created_by: info.data.created_by,
        };
        originalRef.current = payloadRef;
      } catch (e) {
        console.error(e);
        notification.error({
          message: "שגיאה",
          description: "כשלון בטעינת המשוב",
        });
      } finally {
        setLoading(false);
        setDataLoaded(true);
      }
    };
    fetchFeedbackInfo();
  }, [props.mode, feedbackId]);

  useEffect(() => {
    if (selectedOption === 3) setSelectedOptionGrade(10);
  }, [selectedOption]);

  const gradOption = [
    { id: 1, value: "אופציה 1" },
    { id: 2, value: "אופציה 2" },
    { id: 3, value: "אופציה 3" },
    { id: 4, value: "ציון סופי" },
  ];

  const handleCreateFeedback = async () => {
    setLoading(true);
    setMessage("");

    if (feedbackName?.trim().length === 0) {
      Notification({ type: "error", msg: "יש להקליד שם משוב" });
      setLoading(false);
      return;
    }
    if (!categories?.some((cat) => cat?.trim())) {
      Notification({ type: "error", msg: "יש להוסיף לפחות קטגוריה אחת" });
      setLoading(false);
      return;
    }
    if (!isUnique(categories)) {
      Notification({ type: "error", msg: "יש כפילות בשם קטגוריות" });
      setLoading(false);
      return;
    }
    if (selectedOptionGrade == null) {
      Notification({ type: "error", msg: "יש לבחור ציון לתוצאה" });
      setLoading(false);
      return;
    }
    if (!selectedCourse?.id) {
      Notification({ type: "error", msg: "לא נבחר קורס" });
      setLoading(false);
      return;
    }
    if (selectedTeam && !selectedTeam.id) {
      Notification({ type: "error", msg: "צוות נבחר אינו תקין" });
      setLoading(false);
      return;
    }

    const feedbackData: any = {
      name: feedbackName.trim(),
      select_option_score: selectedOptionGrade,
      created_by: selectedPermission?.user_id,
      categoryComment: catagoryComment,
      is_active: true,
      seenGrade: seenGradeToUser,
      categories: categories
        .filter((cat) => cat?.trim())
        .map((cat) => ({ category: cat.trim() })),
      questions: questions
        .filter((q) => q?.trim())
        .map((q) => ({ question_text: q.trim() })),
    };

    if (isEdit) {
    } else {

      if (isHigherThanTeamCommander) {
        feedbackData.team_id =
          teamScope === "course" ? null : baseTeamId || selectedTeam?.id;
      } else {
        feedbackData.team_id = teamScope === "team" ? baseTeamId || selectedTeam?.id : null;
      }
      feedbackData.courseId = selectedCourse?.id;
    }

    if (isEdit) {
      if (originalRef.current && isEqual(originalRef.current, feedbackData)) {
        Notification({ type: "success", msg: "המשוב עודכן בהצלחה" });
        setTimeout(() => navigate("/feedbackDashboard"), 2000);
        return;
      }
      try {
        const result = await updateFeedaback(feedbackData, Number(feedbackId));
        if (result.success) {
          Notification({ type: "success", msg: "המשוב עודכן בהצלחה" });
          await queryClient.refetchQueries({
            queryKey: [
              "feedbackcourseId",
              selectedCourse?.id,
              "feedbackteamId",
              selectedTeam?.id,
            ],
          });
          queryClient.invalidateQueries({ queryKey: ["feedbackForm"] });
          navigate("/feedbackDashboard");
        }
      } catch (e) {
        console.error("Error:", e);
      } finally {
        setLoading(false);
      }
    } else {
      try {
        const result = await createFeedback(feedbackData);
        if (result.success) {
          Notification({ type: "success", msg: "המשוב נוצר בהצלחה" });
          await queryClient.refetchQueries({
            queryKey: [
              "feedbackcourseId",
              selectedCourse?.id,
              "feedbackteamId",
              selectedTeam?.id,
            ],
          });
          setTimeout(() => navigate("/feedbackDashboard"), 2000);
        }
      } catch (e) {
        console.error("Error:", e);
      } finally {
        setLoading(false);
      }
    }
  };

  const removeCategory = (index: number) => {
    const newCategories = [...categories];
    newCategories.splice(index, 1);
    setCategories(newCategories);
  };

  const addCategory = () => {
    const trimmed = newCategory.trim();
    if (!trimmed) {
      Notification({ type: "error", msg: "שם קטגוריה לא תקין" });
      return;
    }
    const alreadyExists = categories.some(
      (c) => c.toLowerCase() === trimmed.toLowerCase()
    );
    if (alreadyExists) {
      Notification({ type: "error", msg: "הקטגוריה כבר קיימת" });
      return;
    }
    setCategories((prev) => [...prev, trimmed]);
    setNewCategory("");
  };

  const addQuestion = () => {
    if (newQuestion.trim() !== "") {
      setQuestions([...questions, newQuestion.trim()]);
      setNewQuestion("");
    }
  };

  const removeQuestion = (index: number) => {
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
    if (selectedQuestion === index) setSelectedQuestion(null);
  };

  const ratingOptions1 = {
    level1: ["מעולה", "טוב מאוד", "טוב", "סביר", "לא מספיק"],
    level2: ["מצויין", "מעולה", "טוב מאוד", "טוב", "בינוני", "חלש", "לא מספיק"],
    level3: [
      "מצויין",
      "מעולה",
      "טוב מאוד",
      "טוב",
      "בינוני גבוהה",
      "בינוני",
      "בינוני נמוך",
      "חלש",
      "גרוע",
      "לא מספיק",
    ],
  };

  const ratingOptions2 = {
    level1: [
      "יוצא מן הכלל",
      "מעל הצפוי",
      "בהתאם לצפוי",
      "מתחת לצפוי",
      "רחוק מהנדרש",
    ],
    level2: [
      "יוצא מן הכלל",
      "גבוה מאוד",
      "גבוה",
      "תקין",
      "טעון שיפור",
      "נמוך",
      "רחוק מהנדרש",
    ],
    level3: [
      "יוצא מן הכלל",
      "מעולה",
      "טוב מאוד",
      "טוב",
      "כמעט טוב",
      "בינוני",
      "בינוני נמוך",
      "נמוך",
      "חלש מאוד",
      "רחוק מהנדרש",
    ],
  };

  const ratingOptions3 = {
    level1: ["מעולה", "טוב מאוד", "טוב", "טעון שיפור", "לא מספיק"],
    level2: [
      "מעולה",
      "טוב מאוד",
      "טוב",
      "בינוני",
      "טעון שיפור",
      "חלש",
      "לא מספיק",
    ],
    level3: [
      "מעולה",
      "טוב מאוד",
      "טוב",
      "כמעט טוב",
      "בינוני",
      "בינוני נמוך",
      "חלש",
      "חלש מאוד",
      "גרוע",
      "לא מספיק",
    ],
  };

  const getRatingOptions = (ratingType: number | null, level: number) => {
    switch (ratingType) {
      case 1:
        return (
          ratingOptions1[`level${level}` as keyof typeof ratingOptions1] || []
        );
      case 2:
        return (
          ratingOptions2[`level${level}` as keyof typeof ratingOptions2] || []
        );
      case 3:
        return (
          ratingOptions3[`level${level}` as keyof typeof ratingOptions3] || []
        );
      default:
        return [];
    }
  };

  const updateTheGradeSelected = (level: number, ratingType: number) => {
    return (ratingType - 1) * 3 + level;
  };

  const renderRatingTable = (ratingType: number | null) => {
    return (
      <div className={style.ratingTable}>
        {[1, 2, 3].map((level) => (
          <div
            key={level}
            className={`${style.levelColumn} ${selectedLevel === level ? style.selectedLevel : ""
              }`}
            onClick={() => {
              if (isView) return;
              setSelectedLevel(level);
              setSelectedOptionGrade(
                updateTheGradeSelected(level, Number(ratingType))
              );
            }}
          >
            <span
              className={`${style.levelTitle} ${selectedLevel === level ? style.selectedLevelTitle : ""
                }`}
            >
              {level === 1 ? "5" : level === 2 ? "7" : "10"}
            </span>
            <div className={style.optionsContainer}>
              {getRatingOptions(ratingType, level).map((option, idx) => (
                <div key={idx} className={style.optionItemC}>
                  {option}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const handleCategoryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) =>
    addCategory();
  const handleQuestionKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) =>
    addQuestion();

  if (isEdit && !dataLoaded && feedbackId) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
          direction: "rtl",
        }}
      >
        <Spin size="large" tip="טוען משוב..." />
      </div>
    );
  }


  return (
    <div className={style.container}>
      <div className={style.header}>
        {isCreate && isHigherThanTeamCommander && (
          <div className={style.accessibilityContainer}>
            <Tooltip
              title="בחר האם תבנית המשוב תהיה נגישה לכל הצוותים שבקורס או רק לצוות הנבחר"
              placement="bottom"
            >
              <InfoCircleOutlined
                style={{
                  fontSize: "1.1rem",
                  color: "#999",
                  cursor: "pointer",
                }}
              />
            </Tooltip>
            <span style={{ fontWeight: "bold" }}>נגישות המשוב:</span>
            <Radio.Group
              value={teamScope}
              onChange={(e) => setTeamScope(e.target.value)}
            >
              <Radio.Button value="team">
                <TeamOutlined /> צוות ספציפי (
                {selectedTeam?.name || `צוות ${baseTeamId}`})
              </Radio.Button>
              <Radio.Button value="course">
                <ApartmentOutlined /> כל הצוותים בקורס
              </Radio.Button>
            </Radio.Group>
          </div>
        )}

        <div className={style.headerTitle}>
          {teamScope === "team" ? (
            <h3>{selectedTeam?.name || `צוות ${baseTeamId}`} - תבנית משוב</h3>
          ) : (
            <h3>{selectedCourse?.name} - תבנית משוב</h3>
          )}
        </div>
      </div>

      {showNoPermissionMessage && (
        <div
          style={{
            background: "#fff3cd",
            border: "2px solid #ffc107",
            borderRadius: 12,
            padding: 20,
            marginTop: 20,
            textAlign: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          <span
            style={{
              color: "#856404",
              fontWeight: 600,
              fontSize: 16,
              display: "block",
            }}
          >
            ⚠️ משוב שנוצר לכלל הצוותים בקורס ולכן לא ניתן לעריכה
          </span>
        </div>
      )}

      <div className={style.catagoryContainer}>
        <div style={{ width: "90%" }}>
          <h5>שם המשוב</h5>
        </div>
        <div className={style.questionInput}>
          <RegularInput
            disabled={isFieldDisabled}
            value={feedbackName}
            setValue={setFeedbackName}
            width="95%"
            height="4.6vh"
            placeholder="שם המשוב"
            readonly={isView}
          />
        </div>
      </div>

      <div className={style.catagoryContainer} style={{ marginTop: 20 }}>
        <div className={style.questionInput}>
          <RegularInput
            disabled={isFieldDisabled}
            value={catagoryComment}
            setValue={setCatagoryComment}
            width="95%"
            height="4.6vh"
            readonly={false}
            placeholder="כתוב הערה"
          />
        </div>
        <div style={{ width: "90%" }}>
          <h4>קטגוריות חוזקות וחולשות לבחירה</h4>
        </div>
        {categories.map((category, index) => (
          <div key={index} className={style.categoryItem}>
            <RegularInput
              disabled={isFieldDisabled}
              value={category}
              setValue={(value) => {
                const newCategories = [...categories];
                newCategories[index] = value;
                setCategories(newCategories);
              }}
              maxLength={25}
              width="95%"
              height="4.6vh"
              readonly={false}
              placeholder="כתוב קטגוריה"
              suffix={
                !isFieldDisabled ? (
                  <Button
                    type="text"
                    danger
                    onClick={() => removeCategory(index)}
                    style={{ padding: 0, width: "auto" }}
                    icon={
                      <CloseOutlined
                        style={{ color: "black", background: "none" }}
                      />
                    }
                  />
                ) : (
                  <></>
                )
              }
            />
          </div>
        ))}
        <div className={style.addCategoryRow}>
          <RegularInput
            disabled={isFieldDisabled}
            maxLength={25}
            value={newCategory}
            setValue={setNewCategory}
            backgroundColor="rgb(229, 218, 195)"
            width="95%"
            height="4.6vh"
            placeholder="הוסף קטגוריה חדשה"
            onEnterclickProps={handleCategoryKeyDown}
            suffix={
              !isFieldDisabled ? (
                <div
                  onClick={addCategory}
                  style={{
                    cursor: "pointer",
                    fontSize: 30,
                    padding: "0 12px",
                    width: "auto",
                    height: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  +
                </div>
              ) : (
                <></>
              )
            }
          />
        </div>
      </div>

      <div className={style.catagoryContainer} style={{ marginTop: 20 }}>
        <div style={{ width: "90%", display: "flex", alignItems: "center", gap: 12 }}>
          <h5 style={{ paddingLeft: "15px" }}>בחר אופציות לנתינת ציון סופי</h5>
          <Tooltip
            title={
              seenGradeToUser
                ? "לחץ/י להסתרת הציון לנחפף/ת"
                : "לחץ/י להצגת הציון לנחפף/ת"
            }
          >
            <Switch
              checked={seenGradeToUser}
              onChange={(checked) => setSeenGradeToUser(checked)}
            />
          </Tooltip>
          <Tag
            color={seenGradeToUser ? "green" : "volcano"}
            style={{ margin: 0 }}
          >
            {seenGradeToUser ? "ציון גלוי לחניך" : "ציון מוסתר מהחניך"}
          </Tag>
        </div>
        <div className={style.gradeContainer}>
          <div style={{ width: "35%" }}>
            {gradOption?.map((option, index) => (
              <div key={index} className={style.gradOptionItem}>
                <div
                  onClick={() => {
                    if (!isView) setSelectedOption(index);
                  }}
                  style={{
                    padding: "14px",
                    margin: "8px",
                    borderRadius: "14px",
                    cursor: "pointer",
                    width: "100%",
                    background:
                      selectedOption === index
                        ? "rgb(229, 218, 195)"
                        : "rgb(244, 241, 235)",
                    color: "black",
                  }}
                >
                  {option.value}
                </div>
              </div>
            ))}
          </div>
          {[0, 1, 2].includes(Number(selectedOption)) && (
            <div className={style.optionContainer}>
              {renderRatingTable(Number(selectedOption) + 1)}
            </div>
          )}
          {selectedOption === 3 && (
            <div className={style.ratingByGrade}>
              <span>ינתן ציון במספר</span>
            </div>
          )}
        </div>
      </div>

      <div className={style.catagoryContainer} style={{ marginTop: 20 }}>
        <div style={{ width: "90%" }}>
          <h5>הערה לנחפף</h5>
        </div>
        <div className={style.questionInput}>
          <RegularInput
            value={null}
            setValue={() => { }}
            width="95%"
            height="12.6vh"
            readonly={true}
            placeholder="כאן החופף יכתוב הערה לנחפף"
            disabled={true}
            borderRadius={"10"}
          />
        </div>
      </div>
      <div className={style.catagoryContainer} style={{ marginTop: 20 }}>
        <div style={{ width: "90%" }}>
          <h5>הערה לדרג פיקודי </h5>
        </div>
        <div className={style.questionInput}>
          <RegularInput
            backgroundColor="rgb(255, 250, 230)"
            value={null}
            setValue={() => { }}
            width="95%"
            height="12.6vh"
            readonly={true}
            placeholder="כאן החופף יכתוב הערה לדרג פיקודי - לא מוצג לנחפף! "
            disabled={true}
            borderRadius={"10"}
          />
        </div>
      </div>

      <div className={style.catagoryContainer} style={{ marginTop: 20 }}>
        <div style={{ width: "90%" }}>
          <h5>שאלות אופציונאליות</h5>
        </div>
        {questions.map((question, index) => (
          <div key={index} className={style.categoryItem}>
            <RegularInput
              disabled={isFieldDisabled}
              value={question}
              setValue={(value) => {
                const newQuestions = [...questions];
                newQuestions[index] = value;
                setQuestions(newQuestions);
              }}
              width="95%"
              height="4.6vh"
              readonly={false}
              placeholder="כתוב שאלה"
              suffix={
                !isFieldDisabled ? (
                  <Button
                    type="text"
                    danger
                    onClick={() => removeQuestion(index)}
                    style={{ padding: 0, width: "auto" }}
                    icon={
                      <CloseOutlined
                        style={{ color: "black", background: "none" }}
                      />
                    }
                  />
                ) : (
                  <></>
                )
              }
            />
          </div>
        ))}
        <div className={style.addCategoryRow}>
          <RegularInput
            disabled={isFieldDisabled}
            value={newQuestion}
            setValue={setNewQuestion}
            backgroundColor="rgb(229, 218, 195)"
            width="95%"
            height="4.6vh"
            placeholder="הוסף שאלה חדשה"
            onEnterclickProps={handleQuestionKeyDown}
            suffix={
              !isFieldDisabled ? (
                <div
                  onClick={addQuestion}
                  style={{
                    cursor: "pointer",
                    fontSize: 30,
                    padding: "0 12px",
                    width: "auto",
                    height: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  +
                </div>
              ) : (
                <></>
              )
            }
          />
        </div>
      </div>

      <div
        style={{
          direction: "rtl",
          width: "40%",
          padding: 20,
          justifyContent: "end",
          display: "flex",
          position: "sticky",
          bottom: 0,
        }}
      >
        {!isView && hasPermission && (
          <BlackButton
            width="5vw"
            height="5vh"
            onclickProps={handleCreateFeedback}
          >
            {buttonLabel}
          </BlackButton>
        )}
      </div>
    </div>
  );
};

export default FeedbackCreate;
