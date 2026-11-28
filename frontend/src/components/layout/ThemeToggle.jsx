
import { useState } from "react";
import { Moon, Sun } from "lucide-react";

const THEME_KEY = "fitorbit-theme";

export default function ThemeToggle() {

  const [theme, setTheme] = useState(() =>
    document.documentElement.dataset.theme === "light"
      ? "light"
      : "dark"
  );

  const dark = theme === "dark";

  const label = dark
    ? "Switch to light mode"
    : "Switch to dark mode";


  function toggleTheme() {

    const nextTheme = dark ? "light" : "dark";

    document.documentElement.dataset.theme = nextTheme;

    setTheme(nextTheme);

    try {
      localStorage.setItem(THEME_KEY, nextTheme);
    } catch {
      // Theme still works if storage is unavailable.
    }
  }


  return (
    <button
      type="button"
      className="fo-theme-toggle"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
    >
      {dark ? (
        <Sun size={20} aria-hidden="true" />
      ) : (
        <Moon size={20} aria-hidden="true" />
      )}
    </button>
  );
}
