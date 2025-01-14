import { useState } from 'react'
import './App.css'
import { BlockComparisonWidget } from './components/BlockComparisonWidget'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8 ">
      <BlockComparisonWidget />
    </div>
  )
}

export default App
