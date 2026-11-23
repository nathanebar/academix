import { ConfigProvider, Input, Select } from "antd";
import BlackButton from "../../../UI/Button/BlackButton";
import ScoreChartUserForms from "../../DashboardUserForms/ScoreChartUserForms/ScoreChartUserForms";
import style from "./TeamsFormsBody.module.css";
import { BorderOutlined, SearchOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import FormDiv from "../../../utils/FormDiv/FormDiv";
import { useFetchFormsByCourseIdAndTeamId } from "../../../hooks/Forms/useFetchFormsByTeamId";
import { useSelectionsStore } from "../../../store/selectionStore";
import LineChartForms from "./LineChartForms";
import { useNavigate } from "react-router-dom";
import { useFilteredData } from "../../../hooks/useFilteredData";
import FormsChart from "./FormsChart/FormsChart";

const TeamsFormsBody = () => {
  const GRADE_LEGEND = [
    { label: 'מצוין', min: 90, max: 100, color: '#10b981', emoji: '🌟' },
    { label: 'טוב מאוד', min: 80, max: 89, color: '#3b82f6', emoji: '👍' },
    { label: 'בינוני', min: 70, max: 79, color: '#f59e0b', emoji: '⚠️' },
    { label: 'דורש שיפור', min: 0, max: 69, color: '#ef4444', emoji: '❌' },
  ];

  const [filterValue, setFilterValue] = useState<string>("");
  const [forms, setForms] = useState<any>(null);
  const [filterdForms, setFilterdForms] = useState<any>(null);

  const { selectedTeam, selectedCourse, selectedCourseBatch } = useSelectionsStore();

  const teamId =
    selectedTeam?.id !== undefined && selectedTeam?.id !== null
      ? selectedTeam?.id
      : undefined;


  const fetchForms = useFetchFormsByCourseIdAndTeamId(
    selectedCourse?.id,
    teamId,
    selectedCourseBatch?.id
  );


  const { filteredCourseBatches } = useFilteredData();

  useEffect(() => {
    if (teamId) {
      fetchForms.refetch();
    }
  }, [teamId, selectedCourseBatch?.id]);

  const navigate = useNavigate();

  useEffect(() => {
    if (filterValue.trim() === "") {
      setForms(filterdForms);
    } else if (forms) {
      setForms(
        forms.filter((form: any) =>
          form?.title.toLowerCase().includes(filterValue.toLowerCase())
        )
      );
    }
  }, [filterValue]);

  useEffect(() => {
    if (fetchForms.data) {
      setForms(fetchForms.data);
      setFilterdForms(fetchForms.data);
    }
  }, [fetchForms.data]);

  const dateOptions = [
    { value: "מהישן לחדש" },
    { value: "מהחדש לישן" },
  ];

  const scoreOptions = [
    { value: "מציון ממוצע נמוך לגבוה" },
    { value: "מציון ממוצע גבוה לנמוך" },
  ];

  const handleClick = (string: string, type: string) => {
    if (type === "date") {
      const sortedForms = [...forms].sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        if (string === "מהחדש לישן") {
          return dateB - dateA;
        } else {
          return dateA - dateB;
        }
      });
      setForms(sortedForms);
    } else {
      const sortedForms = [...forms].sort((a, b) => {
        const scoreA = a.scores_average;
        const scoreB = b.scores_average;
        if (string === "מציון ממוצע גבוה לנמוך") {
          return scoreB - scoreA;
        } else {
          return scoreA - scoreB;
        }
      });
      setForms(sortedForms);
    }
  };

  if (!filteredCourseBatches || filteredCourseBatches.length === 0) {
    return (
      <div style={{ padding: 30, fontSize: 30 }}>
        אין מחזורים זמינים
      </div>
    );
  }

  if (!teamId) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div style={{ fontSize: "48px" }}>👆</div>
        <div
          style={{
            fontSize: "18px",
            color: "#666",
            fontWeight: 500,
          }}
        >
          יש לבחור צוות כדי לצפות בטפסים
        </div>
      </div>
    );
  }

  return (
    <ConfigProvider
      theme={{
        components: {
          Select: {
            borderRadius: 30,
            colorTextPlaceholder: "black",
          },
          Input: {},
        },
      }}
    >
      <div className={style.mainContainer}>
        <FormsChart forms={forms ? forms : []} />

        <div className={style.bottomDiv}>
          <div className={style.titles}>
            <h2>מבחנים ששובצו לתרגילים</h2>
            <BlackButton
              height="3.5vh"
              width="5vw"
              onclickProps={() => navigate("/forms/create")}
            >
              צור מבחן
            </BlackButton>
          </div>

          <div className={style.filters}>
            <Select
              placeholder="מציון ממוצע נמוך לגבוה"
              options={scoreOptions}
              onChange={(option) => handleClick(option, "score")}
              style={{
                width: "185px",
                borderRadius: "30px",
                marginLeft: "0.5vw",
              }}
            />
            <Select
              placeholder="מהישן לחדש"
              options={dateOptions}
              onChange={(option) => handleClick(option, "date")}
              style={{
                width: "120px",
                borderRadius: "30px",
                marginLeft: "0.5vw",
              }}
            />
            <Input
              allowClear
              placeholder="חיפוש חניך, משוב, או תאריך"
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              style={{
                width: "15vw",
                borderRadius: "30px",
                backgroundColor: "rgba(255,255,255,1)",
                border: "none",
                fontWeight: 900,
              }}
              suffix={<SearchOutlined />}
            />
          </div>

          <div className={style.formsDiv}>
            {forms
              ? forms
                ?.filter((form: any) => form?.task_id)
                ?.map((form: any) =>
                  form?.team_ids
                    ?.filter((team: any) => {
                      if (teamId) {
                        return team?.teamId === teamId;
                      } else return true;
                    })
                    ?.map((team: any) => (
                      <FormDiv
                        key={`${form?.id}-${team?.teamId}`}
                        form={form}
                        byUser={false}
                        taskId={Number(form?.task_id)}
                        teamId={Number(team?.teamId)}
                        teamName={team?.teamName}
                        users_count={form?.user_ids?.length}
                        traineeNames={form?.traineeNames}
                      />
                    ))
                )
              : "אין מבחנים"}
          </div>

          {forms && (
            <div className={style.littleTitle}>מאגר תבניות לשאלונים</div>
          )}

          <div className={style.formsDiv}>
            {forms && forms.length > 0
              ? Array.from(
                new Map(
                  forms
                    .filter((form: any) => form?.type === "test")
                    .map((form: any) => [form.id, form])
                ).values()
              ).map((form: any) => (
                <FormDiv
                  key={form.id}
                  form={form}
                  byUser={false}
                  register={true}
                />
              ))
              : "אין מבחנים"}
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default TeamsFormsBody;

