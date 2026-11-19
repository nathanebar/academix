import { ConfigProvider, Modal } from "antd";
import React from "react";

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
      styles={{content:{borderRadius:'20px',height:height}}}
    >
      {title && <h4 style={{fontWeight:600}}>{title}</h4>}
      {children}
    </Modal>
  );
};

export default GenericModal;
