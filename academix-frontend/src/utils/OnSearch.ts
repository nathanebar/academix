import { notification } from "antd";
import { GetUserData } from "../services/ApiServices";
import * as React from "react";
import Photo from "../UI/Photo/Photo";

export const OnSearch = async (
  value: string,
  searchInputValue: string,
  setResults: React.Dispatch<React.SetStateAction<any[]>>,
  setResultsObj: React.Dispatch<React.SetStateAction<any[]>>,
  showNotificationOnEmpty: boolean = true 
) => {
  if (searchInputValue.trim() === "") {
    return;
  }
  try {
    setResults([]);

    const res = await GetUserData(value);
    
    if (res?.data?.data?.length === 0 && showNotificationOnEmpty) {
      notification.error({
        message: "שגיאה!",
        description: "לא נמצאו תוצאות נא נסה שנית!",
        duration: 4,
        placement: "top",
        style: { direction: "rtl" },
      });
      return [];
    }

    res?.data?.data.forEach((p: any) => {
      const {
        fullName,
        hierarchy,
        username,
        rank,
        personalNumber,
        basicCourse,
      } = p;
      setResultsObj(res?.data?.data);

      setResults((last) => {
        return [
          ...last,
          {
            value: ` ${username !== undefined ? username + " - " : ""}${
              !rank || rank === "לא ידוע" ? "" : rank + " - "
            }${!fullName || fullName === "לא ידוע" ? "" : fullName + " - "}${
              !hierarchy || hierarchy === "לא ידוע" ? "" : hierarchy
            }`,
            label: React.createElement("div", {
              style: { display: "flex", alignItems: "center" },
              children: [
                React.createElement(Photo, {
                  key: username,
                  username: username,
                  height: "35px",
                  width: "35px",
                  style: { marginLeft: "0.5vw" },
                }),
                React.createElement("div", {
                  style: {
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                  },
                  children: [
                    React.createElement("div", {
                      style: { display: "flex" },
                      children: [
                        React.createElement(
                          "div",
                          { style: { marginLeft: "0.25vw", color: "gray" } },
                          `${!rank || rank === "לא ידוע" ? "" : rank + " "}`
                        ),
                        React.createElement(
                          "div",
                          { style: { color: "gray", fontWeight: "700" } },
                          `${
                            !fullName || fullName === "לא ידוע" ? "" : fullName
                          }`
                        ),
                      ],
                    }),
                    React.createElement("div", {
                      style: {},
                      children: [
                        React.createElement(
                          "span",
                          { style: { color: "gray" } },
                          `${
                            !personalNumber || personalNumber === "לא ידוע"
                              ? ""
                              : " מ.א. "
                          }`
                        ),
                        React.createElement(
                          "span",
                          { style: { color: "gray", fontWeight: "700" } },
                          `${
                            !personalNumber || personalNumber === "לא ידוע"
                              ? ""
                              : personalNumber
                          }`
                        ),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            basicCourse: basicCourse || null,
            fullName: fullName,
          },
        ];
      });
    });
  } catch (error) {
    console.log(error);
  }
};
