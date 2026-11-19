// src/components/GlobalLoader.tsx
import { motion, AnimatePresence } from "framer-motion";
import { useLoading } from "../loading/LoadingProvider";
import { useEffect, useState } from "react";

const MIN_PENDING_DURATION = 300; // אל תציג אם נגמר תוך 300ms
const MIN_DISPLAY_TIME = 200; // אם הוצג, הסתר רק אחרי 200ms

export const GlobalLoader: React.FC = () => {
  const { pending } = useLoading();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // ⬇️ הגדרת טיפוסים עם אתחול ראשוני
    let showTimeout: ReturnType<typeof setTimeout> | null = null;
    let hideTimeout: ReturnType<typeof setTimeout> | null = null;

    if (pending > 0) {
      // ✅ בטל הסתרה מתוכננת
      if (hideTimeout) clearTimeout(hideTimeout);

      // ⏱️ רק אם עדיין pending אחרי MIN_PENDING_DURATION - הצג
      showTimeout = setTimeout(() => {
        setIsVisible(true);
      }, MIN_PENDING_DURATION);
    } else {
      // ✅ בטל הצגה מתוכננת
      if (showTimeout) clearTimeout(showTimeout);

      if (isVisible) {
        // ⏱️ החזק את ה-loader לפחות MIN_DISPLAY_TIME
        hideTimeout = setTimeout(() => {
          setIsVisible(false);
        }, MIN_DISPLAY_TIME);
      }
    }

    return () => {
      if (showTimeout) clearTimeout(showTimeout);
      if (hideTimeout) clearTimeout(hideTimeout);
    };
  }, [pending, isVisible]);

  const AcademixSpinner: React.FC = () => (
    <motion.svg
      width={1000}
      height={200}
      viewBox="0 0 90 90"
      xmlns="http://www.w3.org/2000/svg"
      animate={{
        opacity: [1, 0.3, 1],
      }}
      transition={{
        duration: 1.5,
        ease: "linear",
        repeat: Infinity,
      }}
    >
      <g transform="translate(0, 15)">
        <text x="" y="0" fontSize="20" fontFamily="Helvetica" fill="#E3DAC3">
          A
        </text>
        <text x="15" y="0" fontSize="20" fontFamily="Helvetica" fill="#E3DAC3">
          C
        </text>
        <text x="30" y="0" fontSize="20" fontFamily="Helvetica" fill="#E3DAC3">
          A
        </text>
        <text x="45" y="0" fontSize="20" fontFamily="Helvetica" fill="#E3DAC3">
          D
        </text>
        <text x="60" y="0" fontSize="20" fontFamily="Helvetica" fill="#E3DAC3">
          E
        </text>
        <text x="72" y="0" fontSize="20" fontFamily="Helvetica" fill="#E3DAC3">
          M
        </text>
        <text x="90" y="0" fontSize="20" fontFamily="Helvetica" fill="#E3DAC3">
          I
        </text>
        <text x="97" y="0" fontSize="20" fontFamily="Helvetica" fill="#E3DAC3">
          X
        </text>
      </g>
    </motion.svg>
  );

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="global-loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            flexDirection: "column",
            width: "100%",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <AcademixSpinner />
        </motion.div>
      )}
    </AnimatePresence>
  );
};