import React from "react";
import "./MissionProgressTimeline.css";
import { ClockCircleOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";

interface DelayObject {
  days?: number | null;
  hours?: number | null;
  minutes?: number | null;
  isLate: boolean;
  totalMinutes?: number;
}

interface ExceededRecommendedTime {
  minutes: number;
  isLate: boolean;
}

interface MissionProgressTimelineProps {
  mission: {
    id: number;
    start: string | null;
    completed_at: string | null;
    completed: string | null;
    end: string | null;
    Task?: {
      id: number;
      name: string;
      recommendedTime?: string | null;
      color?: string;
      TaskGroup?: {
        name: string;
        Axis?: {
          color: string;
        };
      };
    };
    timeSinceEnd?: { hours?: number | null; days?: number | null };

    // Nouvelles propriétés
    currentDelay?: DelayObject | null;
    submissionDelay?: DelayObject | null;
    approvalTime?: DelayObject | null;
    exceededRecommendedTime?: ExceededRecommendedTime | null;
  };
}

const MissionProgressTimeline = ({ mission }: MissionProgressTimelineProps) => {
  const hasRecommendedTime = !!mission.Task?.recommendedTime;


  // Déterminer l'état actuel de la mission
  const getCurrentStep = (): number => {
    if (mission.completed && mission.completed_at) return 3;
    if (mission.completed_at) return 2;
    if (!mission.completed && !mission.completed_at && mission.start) return 1;
    return 0;
  };

  // Déterminer la couleur du point d'étape 2
  const getStep2Color = (): string => {
    // Si la mission n'est pas complétée par l'élève
    if (!mission.completed_at) {
      // Si en retard
      if (
        ((mission.timeSinceEnd?.hours ?? 0) > 0 ||
          (mission.timeSinceEnd?.days ?? 0) > 0) &&
        hasRecommendedTime
      ) {
        return "red"; // Rouge - en retard et pas terminé
      }
      return "gray"; // Gris - pas encore dû
    } else {
      if (
        ((mission.submissionDelay?.hours ?? 0) > 0 ||
          (mission.submissionDelay?.days ?? 0) > 0) &&
        hasRecommendedTime
      ) {
        return "orange"; // Orange - complété mais en retard
      }
      return "green"; // Vert - complété dans les temps
    }
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("he-IL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const currentStep = getCurrentStep();
  const step2Color = getStep2Color();


  const getSteps = () => {
    if (hasRecommendedTime) {
      // 3 étapes: שובץ → בוצע → אושר
      return [
        {
          label: "שובץ",
          date: mission.start ? formatDate(mission.start) : null,
        },
        {
          label: mission.completed || mission.completed_at ? "בוצע" : "לא בוצע",
          date: mission.completed_at
            ? formatDate(mission.completed_at)
            : mission.currentDelay?.isLate
            ? `באיחור של ${mission.currentDelay?.hours} שעות`
            : "",
        },
        {
          label: mission.completed ? "אושר" : "לא אושר",
          date:
            mission.completed && mission.completed_at
              ? formatDate(mission.completed)
              : null,
        },
      ];
    } else {
      // 2 étapes: שובץ → אושר (sans בוצע)
      return [
        {
          label: "שובץ",
          date: mission.start ? formatDate(mission.start) : null,
        },
        {
          label: mission.completed ? "אושר" : "לא אושר",
          date:
            mission.completed && mission.completed_at
              ? formatDate(mission.completed)
              : null,
        },
      ];
    }
  };

  const steps = getSteps();

  // Couleurs
  const getStepColor = (stepIndex: number): string => {
    if (stepIndex === 0) {
      // Étape 1 (שובץ) - toujours bleue si active
      return currentStep >= 1 ? "blue" : "gray";
    }
    if (stepIndex === 1) {
      // Étape 2 (בוצע)
      return step2Color;
    }
    if (stepIndex === 2) {
      // Étape 3 (אושר)
      return currentStep >= 3 ? "green" : "gray";
    }
    return "gray";
  };

  return (
    <div className="mission-progress-timeline">
      <div className="mission-progress-steps">
        {steps.map((step, index) => {
          const isActive =
            index < currentStep || (index === currentStep && currentStep > 0);
          const isCurrent =
            index === currentStep - 1 || (index === 0 && currentStep === 1);
          const color = getStepColor(index);
          const isLast = index === steps.length - 1;

          return (
            <div key={index} className="mission-progress-step-wrapper">
              <span
                className={`mission-progress-label mission-progress-label-${color}`}
              >
                {step.label}
              </span>

              {/* Point */}

<Tooltip
                title={step.date || ""}
                placement="top"
                open={step.date ? undefined : false}
              >

              
              {color === "gray" || color === "red" ? (
                <ClockCircleOutlined
                  className="mission-progress-icon mission-progress-icon-gray"
                  style={{ fontSize: 18, color: color }}
                />
              ) : (
                <div
                  className={`mission-progress-dot mission-progress-dot-${color} ${
                    isCurrent ? "current" : ""
                  }`}
                />
              )}
              </Tooltip>
            {/*   <span
                className={`mission-progress-date mission-progress-date-${color}`}
              >
                {step.date || ""}
              </span> */}

              {/* connexion line (not after the last) */}
              {!isLast && (
                <div
                  className={`mission-progress-line mission-progress-line-${
                    index < currentStep ? "completed" : "pending"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MissionProgressTimeline;
