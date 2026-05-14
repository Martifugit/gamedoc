import { GameDocEditor } from "./components/GameDocEditor"
import { ClipboardProvider } from "./context/use-clipboard"

export function App() {
  return (
    <ClipboardProvider>
      <GameDocEditor />
    </ClipboardProvider>
  )
}

export default App
