import type { Theme } from "@/types"

const DARK_QUERY = "(prefers-color-scheme: dark)"

export function applyTheme(theme: Theme) {
  const dark = theme === "dark" || (theme === "system" && window.matchMedia(DARK_QUERY).matches)
  document.documentElement.classList.toggle("dark", dark)
  document.documentElement.classList.toggle("light", !dark)
}

/** Applies the theme now and re-applies when the OS scheme changes. */
export function watchTheme(theme: Theme) {
  applyTheme(theme)
  const query = window.matchMedia(DARK_QUERY)
  const onChange = () => applyTheme(theme)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}
