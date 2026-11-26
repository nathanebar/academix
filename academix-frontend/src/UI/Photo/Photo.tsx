import React, { useState, useRef, useEffect } from "react";
import unknownUserSrc from "../../media/unkownUserPhoto.jpg";
import { Tooltip } from "antd";
import { radius } from "../../theme/tokens";

interface Props {
  username: string | number | undefined;
  width?: string;
  height?: string;
  style?: React.CSSProperties;
  onClick?: any;
  title?: string;
}

const TIMEOUT = 2000;
const DEBOUNCE_DELAY = 300;

// One request per username for the whole session (the same people appear in many lists and pages).
// A definite answer (photo, or "no photo" = HTTP error) is cached; a network error / timeout is not,
// so a later render tries again. Blob URLs are kept for the session (small images, one per user).
const photoCache = new Map<string, Promise<string | null>>();

const fetchPhoto = (username: string): Promise<string | null> => {
  // Internal photo service (closed network); not configured => default image
  const photoApi = process.env.REACT_APP_PHOTO_API_URL;
  if (!photoApi) return Promise.resolve(null);

  const cached = photoCache.get(username);
  if (cached) return cached;

  const request = (async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
    try {
      const resp = await fetch(`${photoApi}?username=${encodeURIComponent(username)}`, {
        signal: controller.signal,
      });
      if (!resp.ok) return null;
      return URL.createObjectURL(await resp.blob());
    } catch {
      photoCache.delete(username); // network error / timeout: not a definite answer
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  })();
  photoCache.set(username, request);
  return request;
};

const Photo = React.memo((props: Props) => {
  const [src, setSrc] = useState<string>(unknownUserSrc);
  const imgRef = useRef<HTMLImageElement>(null);
  // Fetch the photo only when the avatar gets near the viewport (long lists, hidden tabs)
  const [nearViewport, setNearViewport] = useState(false);

  useEffect(() => {
    if (nearViewport) return;
    const el = imgRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setNearViewport(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [nearViewport]);

  useEffect(() => {
    if (!props.username) {
      setSrc(unknownUserSrc);
      return;
    }
    if (!nearViewport) return;

    let cancelled = false;
    const timer = setTimeout(() => {
      fetchPhoto(String(props.username)).then((url) => {
        if (!cancelled) setSrc(url || unknownUserSrc);
      });
    }, DEBOUNCE_DELAY);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [props.username, nearViewport]);

  return (
    <Tooltip title={props.title}>
      <img
        ref={imgRef}
        loading="lazy"
        decoding="async"
        onClick={props.onClick}
        height={props.height || "40vh"}
        width={props.width || "40vw"}
        style={{
          borderRadius: radius.round,
          backgroundSize: "cover",
          backgroundPosition: "center",
          ...props.style,
          cursor: "pointer",
        }}
        alt={String(props.username)}
        src={src}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = unknownUserSrc;
        }}
      />
    </Tooltip>
  );
});

Photo.displayName = 'Photo';

export default Photo;