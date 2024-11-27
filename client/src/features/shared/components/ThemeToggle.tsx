import { Moon, Sun } from "lucide-react";

import { useTheme } from "./ThemeProvider";
import Button from "./ui/button";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const Icon = theme === "light" ? Sun : Moon;

  return (
    <Button
      variant="outline"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="p-2"
    >
      <Icon className="h-5 w-5" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
