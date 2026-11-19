import React, { ReactNode, useState } from "react";
import style from "./switchAffix.module.css";
interface SwitchAffixProps {
  children: ReactNode;
  className?: string;
  position: boolean;
  setPosition: React.Dispatch<React.SetStateAction<boolean>>;
}

const SwitchAffix: React.FC<SwitchAffixProps> = ({
  children,
  className = "",
  setPosition,
  position,
}) => {
  const [startAnimation, setStartAnimation] = useState<boolean>(false);
  const handleClick = () => {
    setPosition(!position);
    setStartAnimation(true);
  };

  return (
    <div
      onClick={handleClick}
      className={className}
      style={{ position: "relative", cursor: "pointer" }}
    >
      <div
        className={`${style["container"]} ${
          startAnimation
            ? position
              ? style["container_animate_true"]
              : style["container_animate_false"]
            : undefined
        } `}
      >
        <div
          className={
            startAnimation
              ? position
                ? style["position_animate_true"]
                : style["position_animate_false"]
              : undefined
          }
          style={{
            position: "absolute",
            marginBottom: -4,
            justifySelf: position ? "flex-start" : "flex-end",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default SwitchAffix;
