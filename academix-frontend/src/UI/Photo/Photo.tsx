import React, { useState, useRef, useCallback, useEffect } from "react";
import unknownUserSrc from "../../media/unkownUserPhoto.jpg";
import { Tooltip } from "antd";

interface Props {
  username: string | number | undefined;
  width?: string;
  height?: string;
  style?: React.CSSProperties;
  onClick?: any;
  title?: string;
}

const Photo = React.memo((props: Props) => {
  const [src, setSrc] = useState<string>(unknownUserSrc);
  const TIMEOUT = 2000;
  const DEBOUNCE_DELAY = 300;
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentBlobUrlRef = useRef<string>(unknownUserSrc);

  // שחרור blob URL (לא משתנה בין רינדורים)
  const revokeBlobUrl = useCallback((url: string) => {
    if (url && url.startsWith('blob:') && url !== unknownUserSrc) {
    
      URL.revokeObjectURL(url);
    }
  }, []);

  useEffect(() => {
    if (!props.username) {
      // שחרור blob אם יש
      revokeBlobUrl(currentBlobUrlRef.current);
      currentBlobUrlRef.current = unknownUserSrc;
      setSrc(unknownUserSrc);
      return;
    }

    // ביטול בקשות קודמות
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const currentRequestId = ++requestIdRef.current;

    timeoutRef.current = setTimeout(async () => {
      if (currentRequestId !== requestIdRef.current) return;

      abortControllerRef.current = new AbortController();

      // Service photo interne (réseau fermé) ; sans configuration => image par défaut
      const photoApi = process.env.REACT_APP_PHOTO_API_URL;
      const candidateUrls: string[] = photoApi
        ? [`${photoApi}?username=${encodeURIComponent(String(props.username))}`]
        : [];

      const tryFetch = async (url: string): Promise<string | null> => {
        if (currentRequestId !== requestIdRef.current) return null;
        
        try {
          const timeoutId = setTimeout(() => {
            abortControllerRef.current?.abort();
          }, TIMEOUT);
          
          const resp = await fetch(url, { signal: abortControllerRef.current!.signal });
          clearTimeout(timeoutId);
          
          if (!resp.ok || currentRequestId !== requestIdRef.current) return null;
          
          const blob = await resp.blob();
          const newBlobUrl = URL.createObjectURL(blob);
          
          // בדיקה שהבקשה עדיין רלוונטית
          if (currentRequestId !== requestIdRef.current) {
            URL.revokeObjectURL(newBlobUrl);
            return null;
          }
          
          // שחרור blob ישן לפני שמירת החדש
          revokeBlobUrl(currentBlobUrlRef.current);
          
          currentBlobUrlRef.current = newBlobUrl;
          setSrc(newBlobUrl);
          return newBlobUrl;
        } catch {
          return null;
        }
      };

      for (const url of candidateUrls) {
        if (currentRequestId !== requestIdRef.current) return;
        
        const result = await tryFetch(url);
        if (result) return;
      }

      // כל הבקשות נכשלו
      if (currentRequestId === requestIdRef.current) {
        revokeBlobUrl(currentBlobUrlRef.current);
        currentBlobUrlRef.current = unknownUserSrc;
        setSrc(unknownUserSrc);
      }
    }, DEBOUNCE_DELAY);

    // ====== הניקוי הקריטי שהיה חסר! ======
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      // שחרור blob URL בכל ניקוי!
      revokeBlobUrl(currentBlobUrlRef.current);
      currentBlobUrlRef.current = unknownUserSrc;
    };
  }, [props.username, revokeBlobUrl]);

  return (
    <Tooltip title={props.title}>
      <img
        onClick={props.onClick}
        height={props.height || "40vh"}
        width={props.width || "40vw"}
        style={{
          borderRadius: "50%",
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