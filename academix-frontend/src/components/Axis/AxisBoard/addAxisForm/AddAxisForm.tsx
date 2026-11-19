import React from "react";
import style from "./axisBoardForm.module.css";
import { Input, notification, Tooltip } from "antd";
import { CloseCircleOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { colors, schemaMap, SchemaName } from "../../../../types/types";

type AddAxisFormProps = {
  onAddAxis: () => Promise<void>;
  onCancel: () => void;
  newAxisName: string;
  setNewAxisName: (value: string) => void;
  selectedColor: SchemaName | undefined;
  setSelectedColor: (color: SchemaName) => void;
  isWide?: boolean;
  onSave?: () => void;
};

const AddAxisForm = ({
  onAddAxis,
  onCancel,
  newAxisName,
  setNewAxisName,
  selectedColor,
  setSelectedColor,
  isWide,
  onSave,
}: AddAxisFormProps) => {
  return (
    <div className={style["add-container"]}>
      <div className={style["color-picker-container"]}>
        <Tooltip color="gray" title="בחר צבע">
          <Tooltip
            color="white"
            arrow={false}
            trigger="click"
            placement="bottomRight"
            title={
              <div className={style["color-picker-tooltip"]}>
                <div className={style["colors-container"]}>
                  {colors.map((color) => {
                    const gradient = schemaMap[color as SchemaName];
                    return (
                      <div
                        key={color}
                        className={`${style["color-option"]} ${selectedColor === color ? style["selected"] : ""
                          }`}
                        style={{
                          background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`,
                        }}
                        onClick={() => {
                          setSelectedColor(color);
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            }
          >
            <div
              className={style["color-preview"]}
              style={{
                background: selectedColor
                  ? `linear-gradient(135deg, ${schemaMap[selectedColor as SchemaName].from
                  }, ${schemaMap[selectedColor as SchemaName].to})`
                  : "linear-gradient(135deg, #E95742,#FF9E90)",
                border: selectedColor ? "3px solid white" : "3px solid white",
              }}
            />
          </Tooltip>
        </Tooltip>
      </div>
      <Input
        style={{ width: isWide ? "100%" : "" }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onSave ? onSave() : onAddAxis();
          }
        }}
        type="search"
        className={style["search-input"]}
        onChange={(e) => {
          if (e.target.value.length < 25) {
            setNewAxisName(e.target.value);
          } else {
            notification.info({
              message: "שם ציר יכול להכיל עד 25 תווים",
              duration: 2,
            });
          }
        }}
        height="5.5vh"
        width="14vw"
        value={newAxisName}
        placeholder="הקלד כותרת לציר..."
      />
      {onSave && (
        <CheckCircleOutlined
          onClick={onSave}
          style={{
            fontSize: 20,
            color: "#52c41a",
            cursor: "pointer",
          }}
        />
      )}

      <CloseCircleOutlined onClick={onCancel} />
    </div>
  );
};

export default AddAxisForm;