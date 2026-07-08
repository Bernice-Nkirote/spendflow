import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark";

type ThemeToggleProps = {
  floating?: boolean;
  className?: string;
};

const THEME_STORAGE_KEY = "tendaflow-theme";

function getSavedTheme(): ThemeMode {
  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return savedTheme === "dark" ? "dark" : "light";
}

export function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

export function initializeTheme() {
  applyTheme(getSavedTheme());
}

function ThemeToggle({ floating = false, className = "" }: ThemeToggleProps) {
  const [theme, setTheme] = useState<ThemeMode>(() => getSavedTheme());
  const isDark = theme === "dark";

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    function handleThemeChanged(event: Event) {
      const customEvent = event as CustomEvent<ThemeMode>;
      setTheme(customEvent.detail);
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === THEME_STORAGE_KEY) {
        setTheme(getSavedTheme());
      }
    }

    window.addEventListener("tendaflow-theme:change", handleThemeChanged);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("tendaflow-theme:change", handleThemeChanged);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  function toggleTheme() {
    const nextTheme: ThemeMode = isDark ? "light" : "dark";
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    setTheme(nextTheme);
    window.dispatchEvent(
      new CustomEvent<ThemeMode>("tendaflow-theme:change", {
        detail: nextTheme,
      }),
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`theme-toggle-button ${floating ? "theme-toggle-floating" : ""} ${className}`.trim()}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span className="theme-toggle-track" aria-hidden="true">
        <span className="theme-toggle-thumb">
          {isDark ? (
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3a6 6 0 0 0 9 7.5A8 8 0 1 1 12 3Z" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2" />
              <path d="M12 20v2" />
              <path d="m4.93 4.93 1.41 1.41" />
              <path d="m17.66 17.66 1.41 1.41" />
              <path d="M2 12h2" />
              <path d="M20 12h2" />
              <path d="m6.34 17.66-1.41 1.41" />
              <path d="m19.07 4.93-1.41 1.41" />
            </svg>
          )}
        </span>
      </span>
      <span className="sr-only">{isDark ? "Light mode" : "Dark mode"}</span>
    </button>
  );
}

export default ThemeToggle;
