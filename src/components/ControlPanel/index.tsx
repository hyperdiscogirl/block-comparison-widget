import type { BlockStack } from '../BlockComparisonWidget/types'
import { PlusIcon, MinusIcon } from 'lucide-react'

type ControlPanelProps = {
  stacks: BlockStack[]
  setStacks: (stacks: BlockStack[]) => void
  mode: 'addRemove' | 'drawCompare'
  setMode: (mode: 'addRemove' | 'drawCompare') => void
  blockIdCounter: number              
  setBlockIdCounter: (value: number | ((prev: number) => number)) => void
}

export function ControlPanel({ 
  stacks, 
  setStacks, 
  mode, 
  setMode,
  blockIdCounter,
  setBlockIdCounter 
}: ControlPanelProps) {
const handleSelectChange = (index: number, value: number) => {
    const startingId = blockIdCounter;
    
    setStacks(stacks.map((stack, i) => {
      if (i === index) {
        // new block ids 
        const newBlocks = Array.from({ length: value }, (_, i) => ({
          id: `stack${stack.id}-block-${startingId + i}`,
          position: i
        }));
        return { ...stack, blocks: newBlocks }
      }
      return stack
    }));
  
    // update counter once after generating all blocks
    setBlockIdCounter(startingId + value);
  }
  

  const updateBlocks = (index: number, increment: boolean) => {
    if (increment) {
      const newBlockId = blockIdCounter;
      
      setStacks(stacks.map((stack, i) => {
        if (i === index && stack.blocks.length < 10) {
          const newBlock = {
            id: `stack${stack.id}-block-${newBlockId}`,
            position: stack.blocks.length
          }
          return {
            ...stack,
            blocks: [...stack.blocks, newBlock]
          }
        }
        return stack
      }));
  
      // update counter after using the ID
      setBlockIdCounter(newBlockId + 1);
    } else {
      setStacks(stacks.map((stack, i) => 
        i === index && stack.blocks.length > 1 
          ? { ...stack, blocks: stack.blocks.slice(0, -1) }
          : stack
      ));
    }
  }

  return (
    <div className="bg-slate-800 rounded-lg shadow-xl text-indigo-100 text-center text-4xl font-bold p-6 h-[90vh] flex flex-col justify-center gap-8">
      <h2 className="font-bold font-mono text-center text-indigo-100">Control Panel</h2>
      <div className="flex gap-5 text-blue-400">
        {stacks.map((stack, index) => (
          <div key={stack.id} className="flex flex-col gap-4">
            <select 
              value={stack.blocks.length} 
              onChange={(e) => handleSelectChange(index, parseInt(e.target.value))}
              className="bg-slate-700 text-white p-2 rounded-md text-center"
            >
              {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
            <div className="flex gap-1">
              <button 
                onClick={() => updateBlocks(index, true)} 
                disabled={stack.blocks.length >= 10}
                className="border bg-blue-500 text-white p-2 rounded-md disabled:opacity-50"
              >
                <PlusIcon />
              </button>
              <button 
                onClick={() => updateBlocks(index, false)} 
                disabled={stack.blocks.length <= 1}
                className="border bg-blue-500 text-white p-2 rounded-md disabled:opacity-50"
              >
                <MinusIcon />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="text-3xl font-mono"> 
        <h3 className="mb-4">Mode</h3>
        <div className="flex flex-col gap-2 justify-center text-2xl">
          <label className="flex items-center gap-2">
            <input 
              type="radio" 
              value="addRemove" 
              checked={mode === 'addRemove'} 
              onChange={() => setMode('addRemove')}
            />
            Add/Remove
          </label>
          <label className="flex items-center gap-2">
            <input 
              type="radio" 
              value="drawCompare" 
              checked={mode === 'drawCompare'} 
              onChange={() => setMode('drawCompare')}
            />
            Draw/Compare
          </label>
        </div>
        <div className="mt-8">
          {mode === 'addRemove' && 
           <p className="text-sm">Double click the stack to add a block, drag the top block to remove</p>}
          {mode === 'drawCompare' && 
           <p className="text-sm">Click and drag from the top of one stack to the other to create a comparison line</p>}
        </div>
      </div>
    </div>
  )
}