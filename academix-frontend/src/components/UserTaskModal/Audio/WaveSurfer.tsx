import {
  CaretRightOutlined,
  DownloadOutlined,
  PauseOutlined,
} from "@ant-design/icons";
import { Button } from "antd";
import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";

const WaveSurferComponent = ({
  url,
  fileName,
}: {
  url: string;
  fileName: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  // Utiliser useRef pour wavesurfer pour éviter les re-renders
  const wsRef = useRef<WaveSurfer | null>(null);

  const handleDownload = async () => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();

      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
    }
  };

  useEffect(() => {
    let wavesurfer: WaveSurfer | null = null;
    let isMounted = true;

    const initWaveSurfer = async () => {
      // Vérifier que le container existe
      if (!containerRef.current || !isMounted) return;

      // Créer un ID unique
      const uniqueId = `ws-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 5)}`;
      containerRef.current.id = uniqueId;

      try {
        // Créer l'instance
        wavesurfer = WaveSurfer.create({
          container: `#${uniqueId}`,
          waveColor: "#99b3cc",
          progressColor: "#1890ff",
          cursorColor: "#1890ff",
          barWidth: 2,
          barRadius: 3,
          height: 60,
          barGap: 3,
          normalize: true,
          // Options supplémentaires pour la stabilité
          backend: "WebAudio",
        });

        wsRef.current = wavesurfer;

        // Events
        wavesurfer.on("ready", () => {
          if (isMounted) {
            console.log("✅ WaveSurfer ready for:", fileName);
            setIsReady(true);
            if (wavesurfer) {
              setDuration(wavesurfer.getDuration());
            }
          }
        });

        wavesurfer.on("error", (err: any) => {
          console.error("❌ WaveSurfer error:", err);
          if (isMounted) {
            setError(err?.message || "Error loading audio");
          }
        });
        wavesurfer.on("audioprocess", () => {
          if (wavesurfer) setCurrentTime(wavesurfer.getCurrentTime());
        });
        wavesurfer.on("play", () => {
          if (isMounted) setIsPlaying(true);
        });

        wavesurfer.on("pause", () => {
          if (isMounted) setIsPlaying(false);
        });
        await wavesurfer.load(url);
      } catch (err: any) {
        console.error("❌ Init error:", err);
        if (isMounted) {
          setError(err?.message || "Failed to initialize");
        }
      }
    };

    // Petit délai pour s'assurer que le DOM est prêt
    const timer = setTimeout(() => {
      initWaveSurfer();
    }, 200);

    // Cleanup
    return () => {
      isMounted = false;
      clearTimeout(timer);

      if (wavesurfer) {
        try {
          wavesurfer.destroy();
        } catch (e) {
          // Ignorer
        }
      }
    };
  }, [url]);
  const formatTime = (time: number): string => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    // Use String.prototype.padStart to zero‑pad
    const minsStr = mins.toString().padStart(2, "0");
    const secsStr = secs.toString().padStart(2, "0");
    return `${minsStr}:${secsStr}`;
  };
  const togglePlay = () => {
    if (wsRef.current && isReady) {
      wsRef.current.playPause();
    }
  };

  // Afficher un message de debug si erreur
  if (error) {
    return (
      <div
        style={{
          marginBottom: "15px",
          background: "#fff1f0",
          padding: "15px",
          borderRadius: "10px",
          border: "1px solid #ffa39e",
        }}
      >
        <div style={{ color: "#cf1322", fontWeight: "bold" }}>
          Erreur: {error}
        </div>
        <div style={{ fontSize: "0.8rem", marginTop: "5px", color: "#666" }}>
          URL: {url}
        </div>
        <Button
          type="link"
          href={url}
          target="_blank"
          style={{ marginTop: "10px" }}
        >
          Tester l'URL directement
        </Button>
      </div>
    );
  }

  return (
    <div
      style={{
        marginBottom: "15px",
        background: "#f0f2f5",
        padding: "5px",
        borderRadius: "10px",
      }}
    >
      <div
        style={{
          marginBottom: "8px",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span>🎵</span>
        <span>{fileName}</span>
      </div>

      <div
        ref={containerRef}
        style={{
          width: "100%",
          marginBottom: "10px",
          minHeight: "60px",
          cursor: isReady ? "pointer" : "default",
          opacity: isReady ? 1 : 0.5,
        }}
        onClick={togglePlay}
      >
        {!isReady && !error && (
          <div style={{ textAlign: "center", padding: "20px", color: "#999" }}>
            טוען...
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          direction: "ltr",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            direction: "ltr",
          }}
        >
          <Button
            type="primary"
            shape="circle"
            size="small"
            icon={isPlaying ? <PauseOutlined /> : <CaretRightOutlined />}
            onClick={togglePlay}
            disabled={!isReady}
          />
          <span style={{ fontSize: "0.85rem", color: "#666" }}>
            {isReady ? (isPlaying ? "מנגן" : "לחץ להשמעה") : "טוען..."}
          </span>
          <div style={{ marginLeft: 10 }}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
        <Button
          type="link"
          icon={<DownloadOutlined />}
          onClick={handleDownload}
          size={"large"}
        />
      </div>
    </div>
  );
};

export default WaveSurferComponent;
