import { useState } from "react";
import ReactPlayer from "react-player";

interface VideoPlayerProps {
  fileUrl: string;
  fileName?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ fileUrl, fileName = "Download Video" }) => {
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    setHasError(true);
  };

  const handleReady = () => {
  };

  if (hasError) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
          border: "1px solid #e9ecef",
          minHeight: "300px",
        }}
      >
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
        <p style={{ marginBottom: "1rem", color: "#6c757d" }}>
          לא ניתן להציג את הסרטון
        </p>
        <a
          href={fileUrl}
          download={fileName}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.75rem 1.5rem",
            backgroundColor: "#007bff",
            color: "white",
            textDecoration: "none",
            borderRadius: "4px",
            fontWeight: "500",
          }}
        >
          ⬇️ הורד קובץ
        </a>
      </div>
    );
  }

  return (
    <ReactPlayer
      url={fileUrl}
      width="100%"
      height="100%"
      controls={true}
      light={false}
      style={{ aspectRatio: "16/9" }}
      onReady={handleReady}
      onError={handleError}
      config={{
        file: {
          forceVideo: true,
        },
      }}
    />
  );
};

export default VideoPlayer;