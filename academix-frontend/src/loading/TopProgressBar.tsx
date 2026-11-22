// Thin, non-blocking progress bar at the top of the screen while React Query is fetching.
// Replaces the full-screen GlobalLoader for reads (#12): the page stays usable, and background
// refetches no longer cover the whole screen. Blocking actions (writes) still use GlobalLoader.
import { useIsFetching } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import style from "./TopProgressBar.module.css";

const SHOW_DELAY = 300; // don't show for fetches that finish quickly (same delay as GlobalLoader)

export const TopProgressBar: React.FC = () => {
  const fetching = useIsFetching() > 0;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!fetching) {
      setVisible(false);
      return;
    }
    const timer = setTimeout(() => setVisible(true), SHOW_DELAY);
    return () => clearTimeout(timer);
  }, [fetching]);

  if (!visible) return null;
  return (
    <div className={style.track} role="progressbar" aria-label="טוען נתונים">
      <div className={style.bar} />
    </div>
  );
};
