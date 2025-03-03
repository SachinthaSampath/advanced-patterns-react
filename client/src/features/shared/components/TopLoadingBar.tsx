import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { Progress } from "./ui/Progress";

export default function TopLoadingBar() {
  const routerState = useRouterState();

  const [progress, setProgress] = useState(0);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    let progressInterval: NodeJS.Timeout | undefined;
    let hasLoadedTimeout: NodeJS.Timeout | undefined;

    if (routerState.status === "pending") {
      setProgress(0);

      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev < 30) {
            return 30;
          }

          const remaining = 90 - prev;
          const increment = Math.random() * (remaining * 0.5);

          return prev + increment;
        });
      }, 500);
    } else {
      setProgress(100);
      hasLoadedTimeout = setTimeout(() => {
        setHasLoaded(true);
      }, 300);
    }

    return () => {
      clearInterval(progressInterval);
      clearTimeout(hasLoadedTimeout);
    };
  }, [routerState.status]);

  if (routerState.status === "idle" && hasLoaded) {
    return null;
  }

  return (
    <Progress
      value={progress}
      className="fixed left-0 right-0 top-0 z-50 h-1 rounded-none bg-transparent dark:bg-transparent"
    />
  );
}
