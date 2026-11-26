import { Modal } from "antd";
import React from "react";
import { radius } from "../../theme/tokens";

type GenericModalProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  width?: string | number;
  height?: string | number;
  title?: string;
  children: React.ReactNode;
};

const GenericModal: React.FC<GenericModalProps> = ({
  isOpen,
  setIsOpen,
  width,
  height,
  title,
  children,
}) => {
  if (!isOpen) return null;
  return (
    <Modal
      onCancel={() => [setIsOpen(false)]}
      footer={null}
      open={isOpen}
      width={width}
      styles={{content:{borderRadius:radius["20"],height:height}}}
    >
      {title && <h4 style={{fontWeight:600}}>{title}</h4>}
      {children}
    </Modal>
  );
};

export default GenericModal;
