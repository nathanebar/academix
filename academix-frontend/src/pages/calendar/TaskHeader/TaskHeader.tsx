// src/components/Calendar/TaskHeader.tsx
import { Tooltip } from "antd";

interface TaskHeaderProps {
  title: string;
  hour: string;
  isOccurrence?: boolean;
  maxLength?: number;                  // רוחב קיצור של שם המשימה
}
export const TaskHeader = ({
  title,
  hour,
  isOccurrence = false,
  maxLength = 18,
}: TaskHeaderProps) => {

  const suffix = isOccurrence ? " - הרחבה" : "";
  const suffixLength = suffix.length; 
  const availableLength = maxLength - suffixLength;
  const needsTruncation = title.length > availableLength;
  const displayTitle = needsTruncation
    ? `${title.slice(0, availableLength)}…`
    : title;
  
  const displayText = displayTitle /* + suffix; */
  const tooltipText = title /* + suffix; */

  return (
    <span style={{ fontSize: "medium", fontWeight: "bold", display: "flex", gap: 4 }}>
      <Tooltip title={<span>{tooltipText}</span>}>
        <span>{displayText}</span>
      </Tooltip>
    </span>
  );
};