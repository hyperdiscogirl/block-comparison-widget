import { useState } from 'react'
import type { BlockStack } from '../BlockComparisonWidget/types'

type ControlPanelProps = {
  stacks: BlockStack[]
  setStacks: (stacks: BlockStack[]) => void
  mode: 'addRemove' | 'drawCompare'
  setMode: (mode: 'addRemove' | 'drawCompare') => void
}

export function ControlPanel({ stacks, setStacks, mode, setMode }: ControlPanelProps) {
  const updateBlocks = (index: number, increment: boolean) => {
    setStacks(stacks.map((stack, i) => {
      const newBlocks = stack.blocks + (increment ? 1 : -1);
      return i === index ? { ...stack, blocks: Math.min(10, Math.max(1, newBlocks)) } : stack;
    }))
  }

  const handleSelectChange = (index: number, value: number) => {
    setStacks(stacks.map((stack, i) => 
      i === index ? { ...stack, blocks: value } : stack
    ))
  }

  return (
    <div className="bg-slate-800 rounded-lg shadow-xl text-indigo-100 text-center text-4xl font-bold p-6 h-[90vh] flex flex-col justify-center gap-8">
      <h2 className="font-bold font-mono text-center text-indigo-100">Control Panel</h2>
      <div className="flex gap-5 text-blue-400">
        {stacks.map((stack, index) => (
          <div key={index} className="flex flex-col gap-4">
            <select 
              value={stack.blocks} 
              onChange={(e) => handleSelectChange(index, parseInt(e.target.value))}
              className="bg-slate-700 text-white p-2 rounded-md text-center"
            >
              {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
            <div className="flex gap-1">
              <button onClick={() => updateBlocks(index, true)} className="border bg-blue-500 text-white px-4 py-2 rounded-md">+</button>
              <button onClick={() => updateBlocks(index, false)} className="border bg-blue-500 text-white px-4 py-2 rounded-md">-</button>
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
          { mode === 'addRemove' &&
           <p className="text-sm"> Click the stack to add a block, drag the top block to remove </p> }
           { mode === 'drawCompare' &&
           <p className="text-sm"> Click and drag from the top of one stack to the other to create a comparison line </p> }
        </div>
      </div>
    </div>
  )
}