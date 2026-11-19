// src/components/Calendar/TaskContainer.tsx
import { CSSProperties, ReactNode } from "react";

interface TaskContainerProps {
  className: any;                 // מודול CSS (style["monthTaskContainer"] וכו')
  onClick: () => void;
  children: ReactNode;
}
export const TaskContainer = ({
  className,
  onClick,
  children,
}: TaskContainerProps) => (
  <div className={className} onClick={onClick}>
    {children}
  </div>
);