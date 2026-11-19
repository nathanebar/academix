import React, { useState, useRef, useEffect } from "react";
import styles from "./Audio.module.css";
import {
  BackwardOutlined,
  CaretRightOutlined,
  DownloadOutlined,
  ForwardOutlined,
  PauseOutlined,
} from "@ant-design/icons";
import { Tooltip } from "antd";
import no_volume from "../../../media/svg/no_volume.svg";
import very_mini_volume from "../../../media/svg/very_mini_volume.svg";
import mini_volume from "../../../media/svg/mini_volume.svg";
import full_volume from "../../../media/svg/full_volume.svg";
import { improveText } from "../../NewTaskModal/TaskMiniBox/TaskMiniBox";

const Audio = ({
  src,
  title,
  s3Key,
  onPlayComplete
}: {
  src: string;
  title: string;
  s3Key: string;
  onPlayComplete?: () => void;
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [src]);

  const handleDownloadClick = async () => {
    try {
      const response = await fetch(src);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch audio file: ${response.status} ${response.statusText}`
        );
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      let fileName = title || "audio.mp3";

      if (fileName && !fileName.includes(".")) {
        fileName += ".mp3";
      }

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Error downloading audio file:", error);
      throw error;
    }
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
       if (onPlayComplete) {
       
        
        onPlayComplete();
      }
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const skipBackward = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = Math.max(0, audio.currentTime - 10);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const skipForward = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = Math.min(duration, audio.currentTime + 10);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    const audio = audioRef.current;

    if (audio) {
      if (newVolume === 0) {
        audio.muted = true;
      } else {
        audio.muted = false;
      }
      audio.volume = newVolume;
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.muted) {
      audio.muted = false;
      audio.volume = 1;
      setVolume(1);
    } else {
      audio.muted = true;
      audio.volume = 0;
      setVolume(0);
    }
  };

  const [isOnScreen, setIsOnScreen] = useState(false);
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const setupIntersectionObserver = () => {
    if (!wrapperRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsOnScreen(entry.isIntersecting);
      },
      {
        threshold: 0.1, // Trigger when 10% of element is visible
        rootMargin: "0px",
      }
    );

    observer.observe(wrapperRef?.current);
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
      audioRef.current?.pause();
      setIsPlaying(false);
    }
  }, [isOnScreen]);
  const t =
    title.indexOf(".") !== -1
      ? title.substring(0, title.lastIndexOf("."))
      : title;

  return (
    <div className={styles.player} ref={wrapperRef}>
      <div className={styles.header}>
        <h3>{improveText(t || "Audio Track", 60, true)}</h3>
      </div>

      <div className={styles.controls}>
        <Tooltip color="gray" title={"החזר 10 שניות"}>
          <button
            onClick={skipBackward}
            className={styles.skipButton}
            aria-label="Skip backward 10 seconds"
          >
            <BackwardOutlined className={styles.icon} />
          </button>
        </Tooltip>

        <Tooltip color="gray" title={isPlaying ? "Pause" : "Play"}>
          <button
            onClick={togglePlay}
            className={styles.playButton}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <PauseOutlined className={styles.icon} />
            ) : (
              <CaretRightOutlined className={styles.icon} />
            )}
          </button>
        </Tooltip>

        <Tooltip color="gray" title={"דלג 10 שניות"}>
          <button
            onClick={skipForward}
            className={styles.skipButton}
            aria-label="Skip forward 10 seconds"
          >
            <ForwardOutlined className={styles.icon} />
          </button>
        </Tooltip>

        <div className={styles.progressBar} onClick={handleSeek}>
          <div
            className={styles.progress}
            style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
          />
        </div>

        <div className={styles.timeInfo}>
          <span>{formatTime(currentTime)}</span>
          <span className={styles.saperator}>/</span>
          <span>{formatTime(duration)}</span>
        </div>

        <Tooltip color="gray" title={"הורד קובץ שמע"}>
          {/* <a href={src} download={s3Key} target="_blank"> */}
          <button
            onClick={handleDownloadClick}
            className={styles.downloadButton}
            aria-label="Download audio"
          >
            <DownloadOutlined />
          </button>
          {/* </a> */}
        </Tooltip>
        <div
          className={styles.volumeContainer}
          onMouseEnter={() => setShowVolumeSlider(true)}
          onMouseLeave={() => setShowVolumeSlider(false)}
        >
          <button
            onClick={toggleMute}
            className={styles.muteButton}
            aria-label={volume > 0 ? "Mute" : "Unmute"}
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

          {showVolumeSlider && (
            <div
              className={styles.volumeSliderContainer}
              onMouseEnter={() => setShowVolumeSlider(true)}
            >
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className={styles.verticalVolumeSlider}
                aria-label="Volume control"
                style={{
                  background: `linear-gradient(to top, #3498db ${
                    volume * 100
                  }%, rgba(255,255,255,0.3) ${volume * 100}%)`,
                }}
              />
            </div>
          )}
        </div>
      </div>

      <audio ref={audioRef} src={src} />
    </div>
  );
};

export default Audio;
