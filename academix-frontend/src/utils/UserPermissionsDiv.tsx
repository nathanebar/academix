import { CloseOutlined } from "@ant-design/icons";
import React from "react";
import Photo from "../UI/Photo/Photo";

type UserProps = {
  usersList: any[];
  setUsersList: any;
  setUser?: any;
  user?:any
  isEditSolider?: boolean;
};

const UserPermissionsDiv: React.FC<UserProps> = ({
  usersList,
  setUsersList,
  setUser,
  user,
  isEditSolider,
}) => {
  const handleDeleteUser = (username: string) => {
    if (user) {
      setUser(null);
    }
    const updateList = usersList.filter((user) => user.username != username);
    setUsersList(updateList);
  };

  return (
    <div
      style={{
        width: "45%",
        display: "flex",
        flexDirection: "column",
        marginTop: "1vh",
        minHeight: "3vh",
        maxHeight: "16vh",
        overflowY: "auto",
      }}
    >
      {usersList.map((user: any, index: number) => (
        <div
          key={index}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            marginTop: 10,
          }}
        >
          <Photo username={user.username} />
          <div
            style={{
              backgroundColor: "rgba(43, 47, 62, 1)",
              height: "4vh",
              borderRadius: "20px",
              color: "white",
              width: "10vw",
              display: "flex",
              justifyContent: "space-around",
              alignItems: "center",
              marginRight: "1vw",
              cursor: "pointer",
            }}
          >
            <p>{user.name || "name"}</p>
            {!isEditSolider && (
              <CloseOutlined onClick={() => handleDeleteUser(user.username)} />
            )}
          </div>
        </div>
      ))}

      <style>
        {`
        .sc::-webkit-scrollbar {
         width: 8px;
        }

        .sc::-webkit-scrollbar-track {
        background: #faf9f9;
        }

        .sc::-webkit-scrollbar-thumb {
        background-color: rgb(223, 222, 222);
        border-radius: 6px;
        }
        `}
      </style>
    </div>
  );
};

export default UserPermissionsDiv;
