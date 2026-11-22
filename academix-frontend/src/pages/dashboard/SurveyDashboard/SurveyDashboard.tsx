import React, { useState, useEffect } from "react";
import { useSurveyDashboard } from "../../../hooks/useSurveyDashboard";
import {
  ConfigProvider,
  Input,
  Select,
  Tooltip,
  Dropdown,
  Menu,
  message,
} from "antd";
import {
  SearchOutlined,
  MoreOutlined,
  FileTextOutlined,
  UserOutlined,
  CalendarOutlined,
  TagOutlined,
  StopOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useSelectionsStore } from "../../../store/selectionStore";
import styles from "./SurveyDashboard.module.css";
import { HeaderPermissionDisplay } from "../../../components/HeaderPermissionDisplay";
import BlackButton from "../../../UI/Button/BlackButton";
import { useNavigate } from "react-router-dom";
import { useFetchSurveysByUser } from "../../../hooks/Forms/useFetchFormsByUserId";
import FormFiltersAndList from "../../../components/DashboardUserForms/FormFiltersAndList/FormFiltersAndList";
import { usePermissionStore } from "../../../store/permissionStore";
import { queryClient } from "../../../api/queryClient";
import { toggleFormActive } from "../../../services/ApiServices";

const SurveyDashboard: React.FC = () => {
  const {
    selectedCourse,
    selectedCourseBatch,
    selectedTeam,
    selectedTeamMember,
  } = useSelectionsStore();
  const { selectedPermission } = usePermissionStore();

  const [filterValue, setFilterValue] = useState<string>("");
  const [dateSort, setDateSort] = useState<string>("");
  const [formFilter, setFormFilter] = useState<string>("");

  const { data, isLoading, error, refetch } = useSurveyDashboard(
    selectedCourse?.id,
    selectedTeam?.id,
    selectedCourseBatch?.id
  );

  const { data: forms } = useFetchSurveysByUser(
    Number(selectedTeamMember?.id),
    selectedTeam?.id,
    selectedCourse?.id,
    selectedPermission?.role_code
  );

  const navigate = useNavigate();

  useEffect(() => {
    if (selectedCourse?.id) {
      refetch();
    }
  }, [selectedCourse?.id, selectedTeam?.id, selectedCourseBatch?.id]);

  const assignedSurveys =
    data?.surveys?.filter((s: any) => s.tasks?.total > 0) || [];

  const uniqueSurveyIds = new Set<string>();
  const repositorySurveys =
    data?.surveys?.filter((s: any) => {
      if (!uniqueSurveyIds.has(s.id)) {
        uniqueSurveyIds.add(s.id);
        return true;
      }
      return false;
    }) || [];

  const sortByDate = (surveys: any[], direction: string) => {
    return [...surveys].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.created_at).getTime();
      const dateB = new Date(b.createdAt || b.created_at).getTime();
      return direction === "מהחדש לישן" ? dateB - dateA : dateA - dateB;
    });
  };

  const sortByResponses = (surveys: any[], direction: string) => {
    return [...surveys].sort((a, b) => {
      const responsesA = a.responses?.totalSubmissions || 0;
      const responsesB = b.responses?.totalSubmissions || 0;
      return direction === "מהרבה למעט"
        ? responsesB - responsesA
        : responsesA - responsesB;
    });
  };

  const filterSurveys = (surveys: any[]) => {
    let filtered = surveys;

    if (filterValue.trim()) {
      filtered = filtered.filter(
        (s: any) =>
          s.title?.toLowerCase().includes(filterValue.toLowerCase()) ||
          s.tasksList?.some((task: any) =>
            task.name?.toLowerCase().includes(filterValue.toLowerCase())
          )
      );
    }

    if (formFilter) {
      if (formFilter === "פעילים") {
        filtered = filtered.filter((s: any) => s.is_active);
      } else if (formFilter === "לא פעילים") {
        filtered = filtered.filter((s: any) => !s.is_active);
      }
    }

    if (dateSort) {
      if (dateSort.includes("תגובות")) {
        filtered = sortByResponses(filtered, dateSort);
      } else {
        filtered = sortByDate(filtered, dateSort);
      }
    }

    return filtered;
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorText}>שגיאה בטעינת הדשבורד</p>
      </div>
    );
  }

  if (!data?.surveys?.length) {
    return (
      <div className={styles.emptyContainer}>
        <span className={styles.emptyIcon}>📭</span>
        <p className={styles.emptyText}>אין סקרים במערכת</p>
        <div className={styles.emptyAction}>
          <BlackButton
            height="3.5vh"
            width="8vw"
            onclickProps={() => navigate("/survey/create")}
          >
            צור סקר
          </BlackButton>
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
      <div className={styles.dashboard}>
        <HeaderPermissionDisplay />

        <div className={styles.header}>
          <h1 className={styles.title}>דשבורד סקרים</h1>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📋</div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>
                {data.summary.totalSurveys}
              </span>
              <span className={styles.statLabel}>סה"כ סקרים</span>
              <span className={styles.statSubLabel}>
                {data.summary.activeSurveys} פעילים
              </span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>📝</div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>
                {data.summary.totalAssignments}
              </span>
              <span className={styles.statLabel}>סה"כ משימות</span>
              <span className={styles.statSubLabel}>שובצו לסקרים</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>💬</div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>
                {data.summary.totalResponses}
              </span>
              <span className={styles.statLabel}>סה"כ תגובות</span>
              <span className={styles.statSubLabel}>
                {data.summary.overallResponseRate}% תגובות
              </span>
            </div>
          </div>
        </div>

        <div className={styles.sectionContainer}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>סקרים ששובצו לתרגילים</h2>
            <BlackButton
              height="3.5vh"
              width="5vw"
              onclickProps={() => navigate("/survey/create")}
            >
              צור סקר
            </BlackButton>
          </div>

          <div className={styles.filters}>
            <Select
              placeholder="מיין לפי"
              options={[
                { value: "מהישן לחדש" },
                { value: "מהחדש לישן" },
                { value: "מהרבה למעט" },
                { value: "מהמעט לרבה" },
              ]}
              onChange={(option) => setDateSort(option)}
              style={{
                width: "130px",
                borderRadius: "30px",
                marginLeft: "0.5vw",
              }}
            />
            <Select
              placeholder="סינון לפי סטטוס"
              options={[
                { value: "הכל" },
                { value: "פעילים" },
                { value: "לא פעילים" },
              ]}
              onChange={(option) =>
                setFormFilter(option === "הכל" ? "" : option)
              }
              style={{
                width: "130px",
                borderRadius: "30px",
                marginLeft: "0.5vw",
              }}
            />
            <Input
              allowClear
              placeholder="חיפוש סקר או תרגיל"
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

          <div className={styles.formsDiv}>
            {assignedSurveys.length > 0 ? (
              filterSurveys(assignedSurveys).flatMap((survey: any) =>
                survey.tasksList?.map((task: any) => (
                  <AssignedSurveyCard
                    key={`${survey.id}-${task.id}`}
                    survey={survey}
                    task={task}
                    onClick={() =>
                      navigate("/survey/members", { state: { survey, task } })
                    }
                  />
                ))
              )
            ) : (
              <div className={styles.emptySection}>
                <span>📭</span>
                <p>אין סקרים ששובצו לתרגילים</p>
              </div>
            )}
          </div>
        </div>

        <div className={styles.sectionContainer}>
          <div className={styles.littleTitle}>מאגר סקרים</div>

          <div className={styles.formsDiv}>
            {repositorySurveys.length > 0 ? (
              repositorySurveys.map((survey: any) => (
                <SurveyCard
                  key={survey.id}
                  survey={survey}
                  onClick={() => navigate(`/survey/edit/${survey.id}`)}
                />
              ))
            ) : (
              <div className={styles.emptySection}>
                <span>📭</span>
                <p>אין סקרים במאגר</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
};

const AssignedSurveyCard: React.FC<{
  survey: any;
  task: any;
  onClick: () => void;
}> = ({ survey, task, onClick }) => {
  const responseCount = task.responsesCount || 0;
  const assignedCount = task.assignmentsCount || 0;

  const getBadgeStyle = () => {
    if (responseCount === 0) {
      return {
        background: "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)",
        color: "#64748b",
      };
    } else if (responseCount === assignedCount) {
      return {
        background: "linear-gradient(135deg, #dcfdf5 0%, #bbf7d0 100%)",
        color: "#059669",
      };
    } else {
      return {
        background: "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)",
        color: "#4f46e5",
      };
    }
  };

  return (
    <div className={styles.cardContainer} onClick={onClick}>
      <div className={styles.mainRow}>
        <div className={styles.titleSection}>
          <FileTextOutlined className={styles.titleIcon} />
          <span className={styles.formTitle}>
            {survey.title?.length > 20
              ? survey.title.substring(0, 20) + "..."
              : survey.title}
          </span>
          {!survey.is_active && (
            <Tooltip title="לא יהיה ניתן להשתמש בסקר זה במשימות חדשות">
              <span className={styles.inactiveBadge}>
                <StopOutlined />
                לא פעיל
              </span>
            </Tooltip>
          )}
        </div>

        <div className={styles.actionsRow}>
          <div className={styles.responseCountBadge} style={getBadgeStyle()}>
            <span>{responseCount} תגובות</span>
          </div>
        </div>
      </div>

      <div className={styles.infoRow}>
        <div className={styles.infoItem}>
          <UserOutlined className={styles.infoIcon} />
          <span>{assignedCount} חניכים</span>
        </div>
        <div className={styles.infoDivider} />
        <div className={styles.infoItem}>
          <CalendarOutlined className={styles.infoIcon} />
          <span>
            {survey.createdAt
              ? dayjs(new Date(survey.createdAt)).format("DD.MM.YY")
              : ""}
          </span>
        </div>
      </div>

      {task.name && (
        <div className={styles.taskNameRow}>
          <TagOutlined className={styles.taskIcon} />
          <span className={styles.taskName}>{task.name}</span>
        </div>
      )}
    </div>
  );
};

const SurveyCard: React.FC<{
  survey: any;
  onClick: () => void;
}> = ({ survey, onClick }) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const { selectedPermission } = usePermissionStore();
  const { selectedTeam } = useSelectionsStore();
  const canEdit =
    selectedPermission?.role_code === "COURSE_COMMANDER" ||
    selectedPermission?.role_code === "SYSTEM-ADMIN" ||
    ((selectedPermission?.role_code === "TEAM_COMMANDER" ||
      selectedPermission?.role_code === "OVERLAP") &&
      survey.surveyTeamId === selectedTeam.id);

  const handleToggleActive = async () => {
    try {
      const result = await toggleFormActive(survey.id);
      if (result.success) {
        message.success(result.message);
        await queryClient.invalidateQueries({
          queryKey: ["surveyDashboard"],
        });
      } else {
        message.error(result.message);
      }
    } catch (error) {
      message.error("אירעה שגיאה");
    }
    setMenuVisible(false);
  };

  const menu = (
    <div onClick={(e) => e.stopPropagation()}>
      <Menu>
        <Menu.Item key="toggle" onClick={handleToggleActive}>
          {survey.is_active ? "הגדר כלא פעיל" : "הגדר כפעיל"}
        </Menu.Item>
      </Menu>
    </div>
  );

  const status = survey.is_active ? "פעיל" : "לא פעיל";
  const statusClass = survey.is_active
    ? styles.statusActive
    : styles.statusInactive;

  return (
    <div className={styles.cardContainer} onClick={onClick}>
      <div className={styles.mainRow}>
        <div className={styles.titleSection}>
          <FileTextOutlined className={styles.titleIcon} />
          <span className={styles.formTitle}>
            {survey.title?.length > 25
              ? survey.title.substring(0, 25) + "..."
              : survey.title}
          </span>
        </div>

        <div className={styles.actionsRow}>
          {!survey.is_active ? (
            <Tooltip title="לא יהיה ניתן להשתמש בסקר זה במשימות חדשות">
              <span className={styles.inactiveBadge}>
                <StopOutlined />
                לא פעיל
              </span>
            </Tooltip>
          ) : (
            <span className={`${styles.statusBadge} ${statusClass}`}>
              {status}
            </span>
          )}
          {canEdit && (
            <Dropdown
              overlay={menu}
              trigger={["click"]}
              onOpenChange={setMenuVisible}
            >
              <span
                className={styles.menuBtn}
                onClick={(e) => e.stopPropagation()}
              >
                <MoreOutlined />
              </span>
            </Dropdown>
          )}
        </div>
      </div>

      {survey.description && (
        <p className={styles.surveyDescription}>
          {survey.description.length > 60
            ? survey.description.substring(0, 60) + "..."
            : survey.description}
        </p>
      )}

      <div className={styles.infoRow}>
        <div className={styles.infoItem}>
          <CalendarOutlined className={styles.infoIcon} />
          <span>
            {survey.createdAt
              ? dayjs(new Date(survey.createdAt)).format("DD.MM.YY")
              : ""}
          </span>
        </div>
        <div className={styles.infoDivider} />
        <div className={styles.infoItem}>
          <span className={styles.infoIcon}>❓</span>
          <span>{survey.questions?.total || 0} שאלות</span>
        </div>
      </div>
    </div>
  );
};

export default SurveyDashboard;