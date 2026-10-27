import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import App from "./App.tsx"
import { AppStateProvider } from "@/hooks/useAppState"
import { loadState } from "@/lib/storage"
import { applyTheme } from "@/lib/theme"

// Apply the saved theme before the first render to avoid a light/dark flash.
applyTheme(loadState().settings.theme)

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppStateProvider>
      <App />
    </AppStateProvider>
  </StrictMode>
)
