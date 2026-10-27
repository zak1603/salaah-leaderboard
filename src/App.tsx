import { TodayScreen } from "@/features/today/today-screen"

export function App() {
  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col">
      <header className="sticky top-0 z-10 flex h-14 items-center border-b bg-background/90 px-4 backdrop-blur">
        <span className="font-semibold">Salaah Leaderboard</span>
      </header>

      <main className="flex-1 px-4 py-4">
        <TodayScreen />
      </main>
    </div>
  )
}

export default App
