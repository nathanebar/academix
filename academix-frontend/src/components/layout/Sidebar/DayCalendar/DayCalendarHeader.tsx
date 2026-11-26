// Header of DayCalendar: team / member name, queue/board switch and the block-dates button
// (split out of DayCalendar.tsx, issue #102).
import React from "react";
import { Switch } from "antd";
import BlockDatesModal from "../../../Modals/BlockDatesModal/BlockDatesModal";
import { cssVar } from "../../../../theme/tokens";

type Props = {
  teamName?: string;
  memberName?: string;
  isQueueView: boolean;
  setIsQueueView: (checked: boolean) => void;
  showBlockDates: boolean;
  isBlockModalOpen: boolean;
  openBlockModal: () => void;
  closeBlockModal: () => void;
  selectedTeamId: React.ComponentProps<typeof BlockDatesModal>["selectedTeamId"];
  selectedCourseBatchId: React.ComponentProps<typeof BlockDatesModal>["selectedCourseBatchId"];
  blockedLabel: string;
};

export default function DayCalendarHeader({
  teamName,
  memberName,
  isQueueView,
  setIsQueueView,
  showBlockDates,
  isBlockModalOpen,
  openBlockModal,
  closeBlockModal,
  selectedTeamId,
  selectedCourseBatchId,
  blockedLabel,
}: Props) {
  return (
    <>
      <h3 style={{ margin: 0 }}>
        {teamName}
        {memberName && " - " + memberName}
      </h3>

      {/* ה-Switch */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          direction: "ltr", // מעבר משמאל לימין
        }}
      >
        <span
          style={{
            fontSize: "12px",
            color: isQueueView ? cssVar("antBlue") : cssVar("grey999"),
          }}
        >
          תור
        </span>
        <Switch
          checked={isQueueView}
          onChange={(checked) => setIsQueueView(checked)}
          unCheckedChildren="לוח"
          size="default"
        />
        <span
          style={{
            fontSize: "12px",
            color: !isQueueView ? cssVar("antBlue") : cssVar("grey999"),
          }}
        >
          לוח שנה
        </span>
      </div>
      {showBlockDates && (
        <BlockDatesModal
          isOpen={isBlockModalOpen}
          onOpen={openBlockModal}
          onClose={closeBlockModal}
          selectedTeamId={selectedTeamId}
          selectedCourseBatchId={selectedCourseBatchId}
          blockedLabelProps={blockedLabel}
        />
      )}
    </>
  );
}
