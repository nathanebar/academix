import { isBusinessConflict } from "../../../../utils/httpStatus";
import React, { ReactElement, useEffect, useState } from "react";
import style from "./GradeStage.module.css";
import { CaretDownFilled, CaretUpFilled } from "@ant-design/icons";
import { Input, notification, Select, Tooltip } from "antd";
import { useTaskStore } from "../../../../store/taskStore";
import { DefaultOptionType } from "antd/es/select";
import { useFetchGradeStagesByCourseId } from "../../../../hooks/useFetchGradeStagesByCourseId";
import { useSelectionsStore } from "../../../../store/selectionStore";
import { createGradeStage } from "../../../../services/ApiServices";
import { queryClient } from "../../../../api/queryClient";
import { usePermissionStore } from "../../../../store/permissionStore";

const { Option } = Select;

interface GradeStageProps {
  gardeStageInDb: number | null;
  setIsChange: any;
  locked?:boolean | undefined
}

const GradeStage = (props: GradeStageProps) => {
  const taskInStore = useTaskStore((state) => state.task);
  const setTaskInStore = useTaskStore((state) => state.addTask);
  const { selectedCourse } = useSelectionsStore();

  const [gradeStages, setGradeStages] = useState<any[]>([]);

  const fetchedGradeStages = useFetchGradeStagesByCourseId(
    Number(selectedCourse?.id)
  );
  const [newGradeStageName, setNewGradeStageName] = useState("");


    const selectedPermission = usePermissionStore(
      (state) => state.selectedPermission
    );
  const handleCreateGradeStage = async () => {
    if (!newGradeStageName.trim()) {
      notification.error({
        message: "לא ניתן ליצור שלב הסמכה ללא שם!",
        duration: 1,
        placement: "top",
        style: { direction: "rtl" },
      });
      return;
    }

    const gradeStageToSend = {
      name: newGradeStageName.trim(),
      courseid: selectedCourse?.id,
    };

    const res = await createGradeStage(gradeStageToSend);

    if (res?.status === 200) {
      notification.success({
        message: "שלב ההסמכה נוצר בהצלחה",
        duration: 1,
        placement: "top",
        style: { direction: "rtl" },
      });

      // setTaskInStore((prev) => ({
      //   ...prev,
      //   gradeStageId: res?.data?.id
      // }));

      queryClient.invalidateQueries({ queryKey: ["gradeStages"] });
      setNewGradeStageName("");
    } else if (isBusinessConflict(res)) {
      notification.error({
        message: "קיים כבר שלב הסמכה בשם זה בקורס זה!",
        duration: 1,
        placement: "top",
        style: { direction: "rtl" },
      });
    }
  };
  useEffect(() => {
    if (fetchedGradeStages?.data) {
      setGradeStages(
        fetchedGradeStages?.data?.map((gs: any) => ({
          id: gs?.id,
          name: gs?.name,
        }))
      );
    }
  }, [JSON.stringify(fetchedGradeStages?.data), selectedCourse?.id]);

  useEffect(() => {
    setTimeout(() => {
      if (props.gardeStageInDb) {
        setTaskInStore({
          ...taskInStore,
          gradeStageId: Number(props.gardeStageInDb),
        });
      }
    }, 100);
  }, []);

  const handleChange:
    | ((
        value: string,
        option?: DefaultOptionType | DefaultOptionType[] | undefined
      ) => void)
    | undefined = (value) => {
    setTaskInStore({ ...taskInStore, gradeStageId: Number(value) });
    props.setIsChange(true);
  };

  return (
    <div className={style.wrapper}>
      <div className={style.header}>
        <span style={{ marginRight: "1.75vw" }}>{"שלב בהסמכה"}</span>
        <div className={style.selectDiv}>
          <Select
          disabled={props?.locked}
            className={style.select}
            suffixIcon={<CaretDownFilled />}
            defaultValue={"שלבי הסמכה"}
            onChange={handleChange}
            value={
              taskInStore.gradeStageId
                ? String(taskInStore.gradeStageId)
                : undefined
            }
            dropdownRender={(menu) => (
              <>
                {menu}
                <div
                  style={{
                    color: "gray",
                    padding: "8px",
                    borderTop: "1px solid #f0f0f0",
                  }}
                >
                 {
                    (selectedPermission?.role_code !== "STUDENT" && selectedPermission?.role_code !== "OVERLAP" && selectedPermission?.role_code !== "TEAM_COMMANDER") &&
                  <Input
                  placeholder="שלב הסמכה חדש"
                  value={newGradeStageName}
                  onChange={(e) => setNewGradeStageName(e.target.value)}
                  onPressEnter={handleCreateGradeStage}
                  />
                }
                </div>
              </>
            )}
          >
            {gradeStages?.map((val) => {
              const words = val.name.toString().split(" ");
              return (
                <Option key={val.id}>
                  <Tooltip
                    title={words?.length > 3 ? val?.name : null}
                    color="gray"
                  >
                    <div className={style.option}>
                      <span className={style.firstWord}>{words?.[0]}</span>
                      <span className={style.secondWord}>
                        {words?.[1]} {words?.[2]} {words?.length > 3 && "..."}
                      </span>
                    </div>
                  </Tooltip>
                </Option>
              );
            })}
          </Select>
        </div>
      </div>

      <div className={style.logo}></div>
    </div>
  );
};

export default GradeStage;
