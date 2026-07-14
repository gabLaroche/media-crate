import { ref, watch } from "vue";

const STORAGE_KEY = "theme";

const theme = ref("light");

const applyTheme = (value) => {
  document.documentElement.setAttribute("data-theme", value);
};

watch(theme, (value) => {
  localStorage.setItem(STORAGE_KEY, value);
  applyTheme(value);
});

export function useTheme() {
  const init = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    theme.value = stored ?? (prefersDark ? "dark" : "light");
    applyTheme(theme.value);
  };

  const toggleTheme = () => {
    theme.value = theme.value === "dark" ? "light" : "dark";
  };

  return { theme, init, toggleTheme };
}
