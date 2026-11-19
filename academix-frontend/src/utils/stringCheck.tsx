import { Tooltip } from "antd";
import React from "react";

const stringCheckAndToolTip = (
  str: string |any,
  maxLength: number
): string | React.ReactElement => {

  
  if (str?.length <= maxLength) return str;

  const truncatedString = str?.slice(0, maxLength - 3) + "...";

  return(
    <Tooltip title={str}>
      <span>{truncatedString}</span>
    </Tooltip>
  )
};

export default stringCheckAndToolTip;
