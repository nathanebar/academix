import React, { useState } from "react";
import style from "../GrdaeStageCard/GrdaeStageCard.module.css";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  CloseOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { improveText } from "../../../../components/NewTaskModal/TaskMiniBox/TaskMiniBox";
import { Button, Input, notification, Popconfirm, Tooltip } from "antd";
import { deleteTag, updateTag } from "../../../../services/ApiServices";
import { queryClient } from "../../../../api/queryClient";
const TagCard = ({ name, id }: { name: string; id: number }) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>(name);

  const handleDelete = async () => {
    try {
      const res = await deleteTag({ id });
      if (res?.status === 200) {
        notification.success({
          key: `key-${new Date()}`,
          message: "שלב ההסמכה נמחק בהצלחה",
          duration: 1,
          placement: "top",
          style: { direction: "rtl" },
        });
        queryClient.refetchQueries({
          queryKey: ["tags"],
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleClose = () => {
    setInputValue(name);
    setIsEditing(false);
  };

  const handleUpdate = async () => {
    if (inputValue?.trim()?.length === 0) {
      notification.error({
        key: `key-${new Date()}`,
        message: "לא ניתן ליצור שלב הסמכה ללא שם!",
        duration: 1,
        placement: "top",
        style: { direction: "rtl" },
      });
      return;
    }
    if (inputValue === name) {
      setIsEditing(false);
      return;
    }
    try {
      const res = await updateTag({ id, name: inputValue });
      if (res?.status === 200) {
        setIsEditing(false);
        notification.success({
          key: `key-${new Date()}`,
          message: "שלב ההסמכה עודכן בהצלחה",
          duration: 1,
          placement: "top",
          style: { direction: "rtl" },
        });
        queryClient.refetchQueries({
          queryKey: ["tags"],
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e?.target?.value);
  };

  const text = improveText(name, 25, false);

  return (
    <div className={style["wrapper"]}>
      <div
        className={style["text"]}
        style={{ width: isEditing ? "70%" : "80%" }}
      >
        {isEditing ? (
          <div className={style["inputWrapper"]}>
            <Input
              className={style["input"]}
              value={inputValue}
              onChange={handleInputChange}
              onPressEnter={handleUpdate}
            />
          </div>
        ) : (
          text
        )}
      </div>
      {isEditing ? (
        <div className={style["btns"]} style={{ width: "27%" }}>
          <div className={style["xBtnWrapper"]}>
            <Tooltip title="ביטול" color="gray">
              <Button
                shape="circle"
                style={{ backgroundColor: "red" }}
                onClick={handleClose}
              >
                <CloseCircleOutlined
                  style={{ color: "white", fontSize: "1rem" }}
                />
              </Button>
            </Tooltip>
          </div>
          <div className={style["editBtnWrapper"]}>
            <Tooltip title="אישור" color="gray">
              <Button
                shape="circle"
                style={{ backgroundColor: "green" }}
                onClick={handleUpdate}
              >
                <CheckCircleOutlined
                  style={{ color: "white", fontSize: "1rem" }}
                />
              </Button>
            </Tooltip>
          </div>
        </div>
      ) : (
        <div className={style["btns"]} style={{ width: "20%" }}>
          <div className={style["xBtnWrapper"]}>
            <Popconfirm
              title={`האם אתם בטוחים שברצונכם למחוק את תג זה?`}
              onConfirm={handleDelete}
            >
              <Tooltip title="למחיקה" color="gray">
                <CloseOutlined className={style["xBtn"]} />
              </Tooltip>
            </Popconfirm>
          </div>
          <div className={style["editBtnWrapper"]}>
            <Tooltip title="לעריכה" color="gray">
              <EditOutlined
                className={style["editBtn"]}
                onClick={handleEditClick}
              />
            </Tooltip>
          </div>
        </div>
      )}
    </div>
  );
};

export default TagCard;
