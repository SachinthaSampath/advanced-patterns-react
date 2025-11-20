export default function Navigation() {
  const { theme, setTheme } = useTheme();

  return (
    <nav className="flex w-64 flex-col gap-4 pt-8">
      <div className="flex items-center justify-between px-4">
        <h2 className="text-lg font-semibold">Navigation</h2>
        <button
          onClick={() => {
            const themes = ["light", "dark", "system"] as const;
            const currentIndex = themes.indexOf(theme);
            const nextTheme = themes[(currentIndex + 1) % themes.length];
            setTheme(nextTheme);
          }}
          className="rounded px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
          title={`Current theme: ${theme}`}
        >
          {theme === "light" ? "☀️" : theme === "dark" ? "🌙" : "💻"}
        </button>
      </div>
    </nav>
  );
}
