import { useEffect, useState } from "react";
import { useSelectionsStore } from "../../../store/selectionStore";
import GenericModal from "../GenericModal";
import BlackButton from "../../../UI/Button/BlackButton";
import { getRank } from "../../../utils/getRankFromPzm";
import style from "./DeleteStudentModal.module.css";
import { updateTeamMember } from "../../../services/ApiServices";
import Notification from "../../../UI/Notification/Notification";
import { Button, ConfigProvider } from "antd";
import { queryClient } from "../../../api/queryClient";

type DeleteStudentModalProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  user: any;
};

const DeleteStudentModal: React.FC<DeleteStudentModalProps> = ({
  isOpen,
  setIsOpen,
  user,
}) => {
  const [userRank, setUserRank] = useState<any>("");
  const [deleteReason, setDeleteReason] = useState<string>("");
  const [height, setHeight] = useState("");
  const [activeButton, setActiveButton] = useState<string>("");
  const { selectedCourse, selectedCourseBatch, selectedTeam } =
    useSelectionsStore();

  const buttons = [
    { id: "button1", label: "מקצועיות" },
    { id: "button2", label: "ציונים נמוכים" },
    { id: "button3", label: "אילוצים אישיים" },
    { id: "button4", label: "טעות שיבוץ" },
  ];

  useEffect(() => {
    const fetchRank = async () => {
      try {
        const rank = await getRank(user.username);
        setUserRank(rank);
      } catch (error) {
        console.log("Error getting rank:", error);
      }
    };

    fetchRank();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerHeight >= 1000) {
        setHeight("42vh");
      } else {
        setHeight("46vh");
      }
    };

    // Set initial height
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  });

  const handleDeleteStudent = async () => {
    const updateStudent = {
      delete_reason:
        deleteReason === "מקצועיות"
          ? "Professionally"
          : deleteReason === "ציונים נמוכים"
          ? "LowGrades"
          : deleteReason === "אילוצים אישיים"
          ? "PersonalCompulsions"
          : "PlacementError",
    };

    try {
      const updatingStudent = await updateTeamMember(
        user?.team_id,
        user?.id,
        updateStudent,
        selectedCourse?.id,
        selectedCourseBatch?.id,
      );

      if (updatingStudent?.status === 201) {
        Notification({ type: "success", msg: "המשתמש הוסר בהצלחה!" });
        setIsOpen(false);
        setDeleteReason("");

        queryClient.invalidateQueries({
          queryKey: ["teamMembers"],
        });
      }
    } catch (error) {
      console.log(error);
      Notification({
        type: "error",
        msg: "שגיאה במחיקת המשתמש,אנא נסה שוב.",
      });
    }
  };

  return (
    <ConfigProvider
      theme={{
        components: {
          Button: {
            textHoverBg: "red",
            colorBgTextHover: "red",
            defaultActiveBg: "red",
            defaultActiveColor: "red",
            textTextActiveColor: "red",
          },
        },
      }}
    >
      <GenericModal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        height={height}
        width="36vw"
        title={`${selectedCourse?.name} / ${selectedCourseBatch?.name}`}
      >
        <h2>האם אתה בטוח שברצונך להסיר את המשתמש ?</h2>
        <div className={style.userDiv}>
          <img
            className={style.userImg}
            alt="userImg"
            src={
              process.env.REACT_APP_PHOTO_API_URL
                ? `${process.env.REACT_APP_PHOTO_API_URL}?username=${user?.username}`
                : require("../../../media/icons/bear_background.jpg")
            }
            onError={(e) => {
              (
                e.currentTarget as HTMLImageElement
              ).src = require("../../../media/icons/bear_background.jpg");
            }}
          />
          <div className={style.userDeatiles}>
            <p>
              {`${userRank ? userRank : ""} `}
              <span style={{ fontWeight: 700 }}>{user.name}</span>
              {`  |  מ.א `}
              <span style={{ fontWeight: 700 }}>{user.militaryid}</span>
              {`  |  ${selectedTeam?.name}`}
            </p>
          </div>
        </div>
        <br />
        <br />

        <p style={{ fontWeight: 500 }}>סיבת ההסרה</p>
        <div
          style={{
            width: "100%",
            height: "6vh",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontWeight: 700,
          }}
        >
          {buttons.map((button) => (
            <Button
              className={style.deleteReasonButton}
              key={button.id}
              onClick={() => {
                setActiveButton(button.id);
                setDeleteReason(button.label);
              }}
              style={{
                width: "20%",
                backgroundColor:
                  activeButton === button.id
                    ? "rgba(197, 178, 141, 1)"
                    : "rgba(244, 241, 235, 1)",
                border: "none",
                height: "5vh",
                borderRadius: "20px",
                fontWeight: 700,
                color: "GrayText",
              }}
            >
              {button.label}
            </Button>
          ))}
        </div>

        <div className={style.buttons}>
          <BlackButton
            width="120px"
            height="36px"
            onclickProps={() => {
              setIsOpen(false);
              setActiveButton("");
            }}
            BGcolor="rgba(244, 241, 235, 1)"
            textColor="rgba(110, 112, 114, 1)"
          >
            ביטול
          </BlackButton>
          <BlackButton
            width="120px"
            height="36px"
            onclickProps={() => handleDeleteStudent()}
          >
            מחיקה
          </BlackButton>
        </div>
      </GenericModal>
    </ConfigProvider>
  );
};

export default DeleteStudentModal;
