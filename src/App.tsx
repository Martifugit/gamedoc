import { GameDocEditor } from "./components/GameDocEditor"
import { ScrollArea } from "./components/ui/scroll-area"

export function App() {
  return (
    <div className="flex h-screen min-h-0 w-screen">
      <ScrollArea className="min-h-0 flex-1">
        <GameDocEditor />
      </ScrollArea>
    </div>
  )
}

export default App
