import React, { InputHTMLAttributes } from "react";
import { AutoComplete, Input } from "antd";
import style from "./inputSearch.module.css";
import { SearchOutlined } from "@ant-design/icons";

type Props = {
  width?: string | undefined;
  height?: string | undefined;
  placeholder?: string;
  onSearch: (value: string) => void;
  onSelect?: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void; 
  value: string;
  options?: { value: string; label: string }[];
};

function InputSearch(props: Props) {
  return (
    <AutoComplete
      options={props.options || []}
      onSearch={props.onSearch}
      onSelect={props.onSelect}
      value={props.value}
      style={{ width: props.width }}
    >
      <Input
        style={{ width: props.width, height: props.height }}
        onKeyDown={(e: any) => {
          if (e.key === "Enter") {
            props.onSearch(props.value);
          }
          props.onKeyDown?.(e);
        }}
        suffix={
          <SearchOutlined
            onClick={(e: any) => props.onSearch(props.value as string)}
          />
        }
        type="search"
        placeholder={props.placeholder}
        className={style["search-input"]}
      />
    </AutoComplete>
  );
}

export default InputSearch;