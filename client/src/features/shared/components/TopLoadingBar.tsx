import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { Progress } from "./ui/Progress";

export default function TopLoadingBar() {
  const routerState = useRouterState();

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let progressInterval: NodeJS.Timeout | undefined;

    if (routerState.status === "pending") {
      setProgress(0);

      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev < 30) {
            return 30;
          }

          if (prev >= 90) {
            return prev;
          }

          const remaining = 90 - prev;
          const increment = Math.random() * (remaining * 0.5);

          return prev + increment;
        });
      }, 400);
    } else {
      setProgress(100);
      clearInterval(progressInterval);
    }

    return () => {
      clearInterval(progressInterval);
    };
  }, [routerState.status]);

  if (routerState.status === "idle" && progress === 100) {
    return null;
  }

  return (
    <Progress
      value={progress}
      className="fixed left-0 right-0 top-0 z-50 h-1 rounded-none bg-transparent dark:bg-transparent"
    />
  );
}
