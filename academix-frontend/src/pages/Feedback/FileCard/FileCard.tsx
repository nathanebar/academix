import React from "react";
// import { Audio } from "./Audio";
// import { Video } from "./Video";
import { FileJpgOutlined } from "@ant-design/icons";
import Audio from "../../../components/UserTaskModal/Audio/Audio";
import Video from "../../../components/UserTaskModal/Video/Video";

import  "./FileCard.css"

type FileItem = {
  id: number;
  type: string;
  name: string;
  s3BucketName: string;
  s3Key: string;
};

interface Props {
  file: FileItem;
  baseUrl: string;
  onPlayComplete?: () => void;
  stringCheckAndToolTip: (s: string, limit: number) => React.ReactNode;
}

export const FileCard: React.FC<Props> = ({
  file,
  baseUrl,
  onPlayComplete,
  stringCheckAndToolTip,
}) => {
  const src = `${baseUrl}/${file.s3BucketName}/${file.s3Key}`;

  const renderContent = () => {
    if (file.type.includes("audio")) {
      return (
        <Audio          src={src}
          s3Key={file.s3Key}
          title={file.name}
          onPlayComplete={onPlayComplete}
        />
      );
    }
    if (file.type.includes("video")) {
      return <Video src={src} title={file.name} onPlayComplete={onPlayComplete} />;
    }
    if (file.type.includes("image")) {
      return <img src={src} alt={file.name} className="file-image" />;
    }
    // fallback – “other” file type
    return (
      <div className="file-other">
        <div className="file-name">{stringCheckAndToolTip(file.name, 20)}</div>
        <FileJpgOutlined className="file-icon" />
      </div>
    );
  };

  return (
    <div className="file-card">
      <div className="file-content">{renderContent()}</div>
      {/* כותרת קובץ – תמיד מופיעה מתחת לתוכן */}
      <div className="file-title" title={file.name}>
        {stringCheckAndToolTip(file.name, 30)}
      </div>
    </div>
  );
};