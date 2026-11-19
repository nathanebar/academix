import { ConfigProvider, Table, notification } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import Photo from "../../../../UI/Photo/Photo";
import BlackButton from "../../../../UI/Button/BlackButton";
import styles from "./SurveyMembersPage.module.css";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import SurveyTextQuestion from "../SurveyQuestion/SurveyTextQuestion/SurveyTextQuestion";
import SurveyAmericanQuestion from "../SurveyQuestion/SurveyAmericanQuestion/SurveyAmericanQuestion";
import SurveyScaleQuestion from "../SurveyQuestion/SurveyScaleQuestion/SurveyScaleQuestion";
import SurveyMatrixQuestion from "../SurveyQuestion/SurveyMatrixQuestion/SurveyMatrixQuestion";

const SurveyMembersPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const survey = location.state?.survey;
  const task = location.state?.task;

  const handleMemberClick = (record: any) => {
    if (record.hasResponded) {
      navigate(`/forms/show/${record.taskAssignmentId}?isSurvey=true`);
    } else {
      notification.warning({
        message: "לא ניתן לצפות בסקר",
        description: "החניך טרם ענה על הסקר",
        placement: "top",
      });
    }
  };

  const buildMembersData = () => {
    if (!task?.traineeDetails || task.traineeDetails.length === 0) {
      if (!task?.traineeNames || task.traineeNames.length === 0) {
        return [];
      }

      return task.traineeNames.map((name: string, index: number) => ({
        key: index,
        id: index,
        name,
        username: name,
        militaryId: "—",
        hasResponded: index < (task.responsesCount || 0),
        taskAssignmentId: null,
      }));
    }

    return task.traineeDetails.map((member: any, index: number) => ({
      key: index,
      id: member.userId || index,
      name: member.name,
      username: member.name,
      militaryId: member.militaryId || "—",
      hasResponded: member.hasResponded ?? index < (task.responsesCount || 0),
      taskAssignmentId: member.taskAssignmentId,
    }));
  };
  const users = buildMembersData();

  const respondedCount = users?.filter(
    (u: { hasResponded: any }) => u.hasResponded
  ).length;
  const notRespondedCount = users?.length - respondedCount;
  const totalCount = users?.length;
  const responsePercentage =
    totalCount > 0 ? Math.round((respondedCount / totalCount) * 100) : 0;

  const pieChartData = [
    { name: "ענו על הסקר", value: respondedCount, color: "rgba(64,179,145,1)" },
    { name: "טרם ענו", value: notRespondedCount, color: "rgba(239,68,68,1)" },
  ].filter((item) => item.value > 0);

  const statusStyle = (hasResponded: boolean) => {
    if (hasResponded) {
      return {
        color: "rgba(64,179,145,1)",
        backgroundColor: "rgba(231,252,246,1)",
        padding: "4px 12px",
        borderRadius: "15px",
        fontWeight: 600,
      };
    } else {
      return {
        color: "rgba(239,68,68,1)",
        backgroundColor: "rgba(255,235,235,1)",
        padding: "4px 12px",
        borderRadius: "15px",
        fontWeight: 600,
      };
    }
  };

  const columns = [
    {
      title: "שם מלא",
      dataIndex: "name",
      key: "name",
      width: 200,
      render: (name: string, record: any) => (
        <div
          onClick={() => handleMemberClick(record)}
          style={{
            height: "4vh",
            width: "10vw",
            display: "flex",
            alignItems: "center",
            justifyContent: "start",
            cursor: "pointer",
          }}
        >
          <Photo username={record.username} />
          <span style={{ marginRight: "1vw", fontWeight: 600 }}>{name}</span>
        </div>
      ),
    },
    {
      title: "מספר אישי",
      dataIndex: "militaryId",
      key: "militaryId",
      width: 150,
      render: (militaryId: string) => (
        <div style={{ height: "100%", display: "flex", alignItems: "center" }}>
          <span style={{ fontWeight: 600 }}>{militaryId}</span>
        </div>
      ),
    },
    {
      title: "סטטוס",
      dataIndex: "hasResponded",
      key: "hasResponded",
      width: 150,
      render: (_: any, record: any) => (
        <div style={{ height: "100%", display: "flex", alignItems: "center" }}>
          <span style={statusStyle(record.hasResponded)}>
            {record.hasResponded ? "ענה על הסקר" : "טרם ענה"}
          </span>
        </div>
      ),
    },
  ];

  const filteredQuestionData = task?.questionData?.find((group: any) =>
    group?.some((user: any) => user?.surevyId === survey?.id)
  );

  return (
    <ConfigProvider
      theme={{
        components: {
          Table: {
            headerColor: "GrayText",
            headerBg: "white",
          },
        },
      }}
    >
      <div className={styles.mainContainer}>
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <h2>{survey?.title || "פרטי סקר"}</h2>
            {task?.name && (
              <span className={styles.taskBadge}>תרגיל: {task.name}</span>
            )}
          </div>
          <BlackButton
            height="3.5vh"
            width="5vw"
            onclickProps={() => navigate(-1)}
          >
            חזור
          </BlackButton>
        </div>
        <div className={styles.statsContainer}>
          <div className={styles.donutCard}>
            <div className={styles.donutTitle}>
              <span className={styles.donutTotalCount}>{totalCount}</span>
              <span className={styles.donutLabel}>נמענים לסקר</span>
            </div>
            <div className={styles.pieContainer}>
              <PieChart width={200} height={200}>
                <Pie
                  style={{ outline: "none" }}
                  data={pieChartData}
                  outerRadius={85}
                  innerRadius={65}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                  animationDuration={800}
                  animationBegin={0}
                >
                  {pieChartData.map((item, index) => (
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
              <div className={styles.donutCenter}>
                <span className={styles.donutPercentage}>
                  {responsePercentage}%
                </span>
              </div>
            </div>
            <div className={styles.legendContainer}>
              <div className={styles.legendItem}>
                <div
                  className={styles.legendColor}
                  style={{ backgroundColor: "rgba(64,179,145,1)" }}
                ></div>
                <span className={styles.legendText}>
                  {respondedCount} ענו על הסקר
                </span>
              </div>
              <div className={styles.legendItem}>
                <div
                  className={styles.legendColor}
                  style={{ backgroundColor: "rgba(239,68,68,1)" }}
                ></div>
                <span className={styles.legendText}>
                  {notRespondedCount} טרם ענו
                </span>
              </div>
            </div>
          </div>
          <div className={styles.statistics}>
            <div className={styles.tableWrapper}>
              {users?.length === 0 ? (
                <div className={styles.emptyContainer}>
                  <div className={styles.emptyIcon}>📭</div>
                  <div className={styles.emptyText}>
                    אין חניכים משובצים לסקר זה
                  </div>
                </div>
              ) : (
                <Table
                  sticky
                  size="middle"
                  columns={columns}
                  dataSource={users}
                  pagination={false}
                  virtual={true}
                  style={{
                    maxHeight: "45vh",
                    overflowY: "auto",
                    scrollbarWidth: "auto",
                    width: "100%",
                    borderRadius: "10px",
                  }}
                />
              )}
            </div>

            {task?.questions?.find((q: any) => q?.question_type === "text") && (
              <SurveyTextQuestion
                question={task?.questions?.find(
                  (q: any) => q?.question_type === "text"
                )}
                questionData={filteredQuestionData}
              />
            )}

            {task?.questions?.find(
              (q: any) => q?.question_type === "scale"
            ) && (
              <SurveyScaleQuestion
                question={task?.questions?.find(
                  (q: any) => q?.question_type === "scale"
                )}
                questionData={filteredQuestionData}
              />
            )}
            {task?.questions?.find(
              (q: any) => q?.question_type === "american"
            ) && (
              <SurveyAmericanQuestion
                question={task?.questions?.find(
                  (q: any) => q?.question_type === "american"
                )}
                questionData={filteredQuestionData}
              />
            )}

            {task?.questions?.find(
              (q: any) => q?.question_type === "matching_pairs"
            ) && (
              <SurveyMatrixQuestion
                question={task?.questions?.find(
                  (q: any) => q?.question_type === "matching_pairs"
                )}
                questionData={filteredQuestionData}
              />
            )}
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default SurveyMembersPage;
