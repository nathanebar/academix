import style from "./studentsTeamManager.module.css";
import { Input } from "antd";
import BlackButton from "../../UI/Button/BlackButton";
import { SearchOutlined } from "@ant-design/icons";
import InputSearch from "../../UI/Input/InputSearch/InputSearch";
import { useState } from "react";
type Props = {
  studentsLength: number;
};

function Title(props: Props) {
  const [name, setName] = useState<string>("");
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <div>{`חניכי צוות געש (${props.studentsLength})`}</div>
      <div style={{ display: "flex", gap: "1vw" }}>
        <InputSearch
          placeholder="חיפוש"
          value={name}
          onSelect={(e:string) => {
            setName(e);
          }}
          onSearch={(e:string) => {
            setName(e);
          }}
        />
        <BlackButton width="5.684210526315789vw" height="2.5vh">
          הוספת חניך +
        </BlackButton>
      </div>
    </div>
  );
}

export default Title;
