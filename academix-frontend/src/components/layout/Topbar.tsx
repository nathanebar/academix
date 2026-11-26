import React, { lazy, Suspense, useEffect, useState } from "react";
import { ConfigProvider, Layout, Menu, Modal, Tooltip } from "antd";
import "./Topbar.css";
import { cssVar, semantic } from "../../theme/tokens";
import { useLocation, useNavigate } from "react-router-dom";
import { RoleSelect } from "../RoleSelect";
import { usePermissionStore } from "../../store/permissionStore";
import he_IL from "antd/locale/he_IL";
import { useUserStore } from "../../store/userStore";
import { useSelectionsStore } from "../../store/selectionStore";
import hiChatLogo from "../../media/icons/hiChatLogo.png";
import questionLogo from "../../media/icons/question-circle 2.png";
import { LogoutOutlined, QqOutlined } from "@ant-design/icons";
import { logout } from "../../services/ntlmService";
import graduateHat from "../../media/svg/graduate-hat.svg";

const { Header } = Layout;

// The tutorial (67 slides, LearningData) is only needed when the user opens it: load it on first open.
const AcademixLearning = lazy(() => import("../AcademixLearning/AcademixLearning"));

interface TopbarProps {
  isSidebarVisible?: boolean;
}

const Topbar: React.FC<TopbarProps> = ({ isSidebarVisible = false }) => {
  const location = useLocation();
  const [selectedKey, setSelectedKey] = useState("/");
  const { selectedPermission, permissions } = usePermissionStore();
  const [isOpenLearning, setIsOpenLearning] = useState<boolean>(false);
  // mounted from the first open on, then kept (same behavior as before for later opens)
  const [learningLoaded, setLearningLoaded] = useState<boolean>(false);
  useEffect(() => {
    if (isOpenLearning) setLearningLoaded(true);
  }, [isOpenLearning]);
  const [modalOpen, setModalOpen] = useState(false);
  const { user, authMode } = useUserStore();

  const {
    selectedDomain,
    selectedCourse,
    selectedCourseBatch,
    selectedTeam,
    selectedTeamMember,
    activeHeaderType,
  } = useSelectionsStore();
  const navigate = useNavigate();

  const menuItems = [
    { key: "/dashboard", label: "דאשבורד" },
    { key: "/calendar", label: "לוח שנה" },
    /*   ...(selectedPermission?.role_code !== "STUDENT"
      ? [{ key: "/courseContent", label: "תכני קורס" }]
      : []), */
    { key: "/courseContent", label: "תכני קורס" },
    { key: "/forms/formDashboard", label: "שאלונים" },
    { key: "/feedbackDashboard", label: "משובים" },
    { key: "/Notebook", label: "המחברת" },

    ...(selectedPermission?.role_code !== "STUDENT"
      ? [{ key: "/studentStatus", label: "סטטוס חניכים" }]
      : []),
    ...(selectedPermission?.role_code !== "STUDENT"
      ? [{ key: "/survey/surveyDashboard", label: "סקרים" }]
      : []),
    ...(selectedPermission?.role_code === "OVERLAP" ||
    selectedPermission?.role_code === "TEAM_COMMANDER"
      ? [{ key: "/dashboard/hoef-dashboard", label: "מסך חופף" }]
      : []),
    .../* selectedPermission?.role_code !== "OVERLAP" && */ (selectedPermission?.role_code !==
    "STUDENT"
      ? [{ key: "/dashboard/HoefOverview", label: "חופפים" }]
      : []),
    { key: "/knowledge-retention", label: "שימור ידע" },
  ];

  useEffect(() => {
    const currentPath = location.pathname;

    const childPrefixMapping: Record<string, string> = {
      "/feedback/": "/feedbackDashboard",
      "/forms/": "/forms/formDashboard",
      "/survey/": "/survey/surveyDashboard",
    };

    const matchedPrefix = Object.keys(childPrefixMapping).find(
      (prefix) => currentPath.startsWith(prefix) || currentPath === prefix
    );
    const mappedKey = matchedPrefix ? childPrefixMapping[matchedPrefix] : null;

    const foundItem = menuItems.find(
      (item) =>
        (mappedKey && item.key === mappedKey) ||
        currentPath === item.key ||
        currentPath.startsWith(item.key + "/")
    );

    if (foundItem) {
      setSelectedKey(foundItem.key);
    } else {
      setSelectedKey("/dashboard");
    }
  }, [location.pathname]);

  const handleClick = (e: { key: string }) => {
    setSelectedKey(e.key);
    if (e.key === "/dashboard") {
      const headerRoutes: Record<string, string> = {
        domain: "/dashboard/domain",
        course: "/dashboard/course",
        courseBatches: "/dashboard/courseBatch",
        team: "/dashboard/team",
        teamMember: "/dashboard/teamMember",
      };

      // 1. On privilégie activeHeaderType
      const routeFromHeader = activeHeaderType
        ? headerRoutes[activeHeaderType]
        : null;
      if (routeFromHeader) {
        navigate(routeFromHeader);
        return;
      }

      // 2. Fallback : on déduit du rôle si rien n'est actif
      const userRole = selectedPermission?.role_code;
      const roleRoutes: Record<string, string> = {
        "SYSTEM-ADMIN": "/dashboard/domain",
        DOMAIN_MANAGER: "/dashboard/domain",
        COURSE_COMMANDER: "/dashboard/course",
        TEAM_COMMANDER: "/dashboard/team",
        OVERLAP: "/dashboard/teamMember",
        STUDENT: "/dashboard/teamMember",
      };
      navigate(
        userRole && roleRoutes[userRole] ? roleRoutes[userRole] : "/untora"
      );
    } else {
      navigate(e.key);
    }
  };

  return (
    <>
      <ConfigProvider
        locale={he_IL}
        theme={{
          components: {
            Menu: {
              colorPrimary: semantic.navAccent, // antd theme tokens need a real color
            },
          },
        }}
      >
        <Header className="topbar">
          <div className="logos-container fixed-logos">
            {selectedPermission?.role_code !== "STUDENT" && <></>}
            {selectedPermission?.role_code !== "STUDENT" && (
              <Tooltip title="לומדה">
                <img
                  src={graduateHat}
                  alt="learningLogo"
                  height={30}
                  width={30}
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    setIsOpenLearning(true);
                  }}
                />
              </Tooltip>
            )}
            <Tooltip title="ליצירת קשר">
              <img
                src={questionLogo}
                alt="questionLogo"
                className="logo hiChatLogo"
                height={20}
                width={20}
                onClick={() => setModalOpen(true)}
              />
            </Tooltip>
            {authMode === "local" && (
              <Tooltip title={user?.name ? `התנתקות (${user.name})` : "התנתקות"}>
                <LogoutOutlined
                  style={{ fontSize: 18, cursor: "pointer" }}
                  onClick={async () => {
                    await logout();
                    window.location.replace("/");
                  }}
                />
              </Tooltip>
            )}
            <img
              src="/logoweb.png"
              alt="Logo"
              className="logo"
              onClick={() => navigate("/")}
            />
          </div>
          <RoleSelect />

          <Menu
            theme="light"
            mode="horizontal"
            items={menuItems}
            onClick={handleClick}
            selectedKeys={[selectedKey]}
            style={{
              width: "100%",
              marginRight: "1vw",
              fontSize: "15px",
              fontWeight: 600,
              gap: 10,
              backgroundColor: cssVar("appBg"),
            }}
          />
        </Header>
      </ConfigProvider>
      {learningLoaded && (
        <Suspense fallback={null}>
          <AcademixLearning
            isOpen={isOpenLearning}
            handleClose={() => {
              setIsOpenLearning(false);
            }}
          />
        </Suspense>
      )}
      <Modal
        title={<div className="modal_title">צור קשר</div>}
        open={modalOpen}
        className="modal"
        footer={null}
        onCancel={() => setModalOpen(false)}
      >
        <div className="modal_second_title">
          אנחנו כאן בשבילכם בהייצ'אט במייל וגם בוויפ!
        </div>

        <div className="modal_contact_details">
          <div className="modal_first_contact_details">
            <div className="modal_first_contact_details_title">
              לקבלת מענה לכל שאלה או תקלה
            </div>
            <div>צוות הפיתוח - </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div>לקבוצת ההייצ'אט של האקדמיקס:</div>
              <img
                src={hiChatLogo}
                alt="hiChat"
                style={{ height: 30, cursor: "pointer" }}
                onClick={() =>
                  process.env.REACT_APP_CHAT_URL &&
                  window.open(process.env.REACT_APP_CHAT_URL, "_blank")
                }
              />
            </div>
            <div className="modal_first_contact_mailAndVoip">
              <div className="mail_container">
                <div>במייל:</div>
            
              </div>
              {/* <hr className="second_separator" /> */}
            </div>
            <div>וויפ : 20249</div>
          </div>

          <hr className="separator" />

          <div className="modal_first_contact_details">
            <div className="modal_second_contact_details_title">
              להמלצות ושיפורים במערכת
            </div>
            <div className="mail_container">
              <div>במייל:</div>
             
            </div>
          </div>
        </div>
      </Modal>

    </>
  );
};

export default Topbar;
