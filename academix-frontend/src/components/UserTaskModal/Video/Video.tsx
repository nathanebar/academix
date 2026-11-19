import React, { useState, useRef, useEffect } from "react";
import style from "./Video.module.css";
import no_volume from "../../../media/svg/w_no_volume.svg";
import very_mini_volume from "../../../media/svg/w_very_mini_volume.svg";
import mini_volume from "../../../media/svg/w_mini_volume.svg";
import full_volume from "../../../media/svg/w_full_volume.svg";
import {
  CaretRightOutlined,
  DownloadOutlined,
  PauseOutlined,
} from "@ant-design/icons";
import { improveText } from "../../NewTaskModal/TaskMiniBox/TaskMiniBox";
import { Tooltip } from "antd";
import stringCheckAndToolTip from "../../../utils/stringCheck";

export type VideoProps = {
  src: string;
  title: string;
   onPlayComplete?: () => void;
};

export const removeExtension: (str: string) => React.ReactElement | string = (
  str: string
) => {
  if (str.indexOf(".") !== -1) {
    return improveText(str.substring(0, str.lastIndexOf(".")), 70);
  }
  return improveText(str, 120);
};

const Video = (props: VideoProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
           if (props.onPlayComplete) {
      
        props.onPlayComplete();
      }
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleDownloadClick = async () => {
    try {
      const response = await fetch(props.src);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch video file: ${response.status} ${response.statusText}`
        );
      }
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = props.title || "video.mp4";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Error downloading video file:", error);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
      videoRef.current.muted = newVolume === 0;
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      videoRef.current.muted = newMuted;
      if (!newMuted && volume === 0) {
        setVolume(1);
        videoRef.current.volume = 1;
      } else {
        setVolume(0);
        videoRef.current.volume = 0;
      }
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };
  const handleSkip = ({ key }: React.KeyboardEvent) => {
    const video = videoRef.current;
    if (!video) return;

    switch (key) {
      case "ArrowRight":
        const plus_newTime = Math.min(duration, video.currentTime + 5);
        video.currentTime = plus_newTime;
        setCurrentTime(plus_newTime);
        break;
      case "ArrowLeft":
        const minus_newTime = Math.min(duration, video.currentTime - 5);
        video.currentTime = minus_newTime;
        setCurrentTime(minus_newTime);
        break;
    }
  };
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  const [isOnScreen, setIsOnScreen] = useState(false);
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);
  const setupIntersectionObserver = () => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsOnScreen(entry.isIntersecting);
      },
      {
        threshold: 0.1, // Trigger when 10% of element is visible
        rootMargin: "0px",
      }
    );

    containerRef?.current?.parentElement?.parentElement &&
      observer.observe(containerRef?.current?.parentElement?.parentElement);
    intersectionObserverRef.current = observer;
  };
  useEffect(() => {
    // Setup intersection observer when component mounts
    setupIntersectionObserver();

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      // Clean up intersection observer
      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect();
      }
    };
  }, []);
  useEffect(() => {
    if (!isOnScreen) {
      videoRef.current?.pause();
      setIsPlaying(false);
    }
  }, [isOnScreen]);

  return (
    <div className={style.container}>
      {/* <div  className={style.title}>{removeExtension(props.title)
}
</div> */}
      <div
        ref={containerRef}
        className={style.wrapper}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          if (isPlaying) {
            setShowControls(false);
          }
        }}
        onKeyDownCapture={handleSkip}
        tabIndex={-1}
      >
        <video
          ref={videoRef}
          key={props.src}
          src={props.src}
          className={style.video}
          style={{
            objectFit:
              videoRef?.current?.videoWidth &&
              videoRef?.current?.videoWidth < 1000
                ? "contain"
                : "cover",
          }}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onClick={handlePlayPause}
          onDoubleClick={toggleFullscreen}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={(e) => console.error("Video error:", e)}
        >
          <source src={props.src} type="video/mp4" />
        </video>

        <div
          className={`${style.controls} ${
            showControls ? style.visible : style.hidden
          }`}
        >
          <Tooltip title={isPlaying ? "Pause" : "Play"} color="gray">
            <button
              onClick={handlePlayPause}
              className={style.controlButton}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <PauseOutlined className={style.icon} />
              ) : (
                <CaretRightOutlined className={style.icon} />
              )}
            </button>
          </Tooltip>

          <span className={style.timeDisplay}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className={style.progressBar}
            aria-label="Video progress"
          />

          <button
            onClick={toggleMute}
            className={style.controlButton}
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            <img
              src={
                volume > 0.75
                  ? full_volume
                  : volume > 0.3
                  ? mini_volume
                  : volume > 0
                  ? very_mini_volume
                  : no_volume
              }
              alt="volume icon"
            />
          </button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className={style.volumeSlider}
            aria-label="Volume"
          />
          <Tooltip title={"הורדת וידאו"} color="gray">
            <button
              onClick={handleDownloadClick}
              className={`${style.controlButton} ${style.downloadButton}`}
              aria-label="Download video"
            >
              <DownloadOutlined />
            </button>
          </Tooltip>
          <Tooltip
            title={isFullscreen ? "יציאה ממסך מלא" : "מסך מלא"}
            color="gray"
          >
            <button
              onClick={toggleFullscreen}
              className={style.controlButton}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              <span className={style.icon}>{"⛶"}</span>
            </button>
          </Tooltip>
        </div>

        {!isPlaying && (
          <button
            onClick={handlePlayPause}
            className={style.playOverlay}
            aria-label="Play video"
          >
            <CaretRightOutlined className={style.icon} />
          </button>
        )}
      </div>
    </div>
  );
};

export default Video;
