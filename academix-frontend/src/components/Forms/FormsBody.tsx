import { ConfigProvider, Input, Select } from "antd";
import BlackButton from "../../UI/Button/BlackButton";
import style from "./FormBody.module.css";
import { useEffect, useState } from "react";
import { SearchOutlined } from "@ant-design/icons";
import useFetchForms from "../../hooks/Forms/useFetchForms";
import FormDiv from "../../utils/FormDiv/FormDiv";

const FormBody = () => {
  const [testvalue, setTestValue] = useState<string>("");
  const [forms, setForms] = useState<any>(null);
  const [filterdForms, setFilterdForms] = useState<any>(null);

  const fetchForms = useFetchForms();


  useEffect(() => {
    if (testvalue.trim() === "") {
      setForms(filterdForms);
    } else {
      setForms(
        forms.filter((form: any) =>
          form?.title.toLowerCase().includes(testvalue.toLowerCase())
        )
      );
    }
  }, [testvalue]);


  
  const handleClick = (string: any) => {
    const sortedForms = [...forms].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();

      if (string === "מהחדש לישן") {
        return dateB - dateA; // Descending
      } else {
        return dateA - dateB; // Ascending
      }
    });

    setForms(sortedForms);
  };
  useEffect(() => {
    if (fetchForms.data) {
      setForms(fetchForms.data);
      setFilterdForms(fetchForms.data);
    }
  }, [fetchForms.data]);

  const options = [
    {
      value: "מהישן לחדש",
    },
    {
      value: "מהחדש לישן",
    },
  ];
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
      <div className={style.mainContainer}>
        <h2>כל המבחנים</h2>
        <div className={style.titles}>
          <h2>מבחנים אחרונים</h2>
          <BlackButton height="3.5vh" width="5vw">
            צור מבחן
          </BlackButton>
        </div>
        <div className={style.filters}>
          <Select
            placeholder="מהישן לחדש"
            options={options}
            onChange={(option) => handleClick(option)}
            style={{
              width: "120px",
              borderRadius: "30px",
              marginLeft: "0.5vw",
            }}
          />
          <Input
            allowClear
            placeholder="חיפוש מבחנים"
            value={testvalue}
            onChange={(e) => setTestValue(e.target.value)}
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
        <div className={style.formsDiv}>
          {forms?.map((form: any) => (
            <FormDiv byUser={false} form={form} status="" />
          ))}
        </div>
      </div>
    </ConfigProvider>
  );
};

export default FormBody;
