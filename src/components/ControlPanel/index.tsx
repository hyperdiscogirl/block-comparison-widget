import type { BlockStack } from '../BlockComparisonWidget/types'
import { PlusIcon, MinusIcon, WrenchIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

type ControlPanelProps = {
  stacks: BlockStack[]
  setStacks: (stacks: BlockStack[]) => void
  mode: 'addRemove' | 'drawCompare'
  setMode: (mode: 'addRemove' | 'drawCompare') => void
  blockIdCounter: number              
  setBlockIdCounter: (value: number | ((prev: number) => number)) => void
  blockSize: 'sm' | 'lg'
  setBlockSize: (size: 'sm' | 'lg') => void
  floatMode: 'synced' | 'staggered' | 'off'
  setFloatMode: (mode: 'synced' | 'staggered' | 'off') => void
  shimmerEnabled: boolean
  setShimmerEnabled: (enabled: boolean) => void
}

export function ControlPanel({ 
  stacks, 
  setStacks, 
  mode, 
  setMode,
  blockIdCounter,
  setBlockIdCounter,
  blockSize,
  setBlockSize,
  floatMode,
  setFloatMode,
  shimmerEnabled,
  setShimmerEnabled
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
    <div className="bg-slate-800 rounded-xl shadow-xl text-indigo-100 text-xl lg:text-2xl p-4 md:p-6 lg:p-12 md:h-[85vh] w-full min-h-fit lg:min-h-0 md:w-[45%] flex flex-col justify-center items-center gap-4 md:gap-6 overflow-y-auto">
      <h2 className="font-bold font-mono text-center text-indigo-100 flex items-center justify-center gap-2 text-2xl lg:text-3xl">
        Control Panel<WrenchIcon />
      </h2>
      <div className="flex min-w-fit justify-center gap-5 text-blue-400">
        {stacks.map((stack, index) => (
          <div key={stack.id} className="flex flex-col items-center gap-4">
            <select 
              value={stack.blocks.length} 
              onChange={(e) => handleSelectChange(index, parseInt(e.target.value))}
              className="bg-slate-700 text-white p-2 rounded-md text-center w-20"
            >
              {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
            <div className="flex justify-center gap-1">
              <button 
                onClick={() => updateBlocks(index, true)} 
                disabled={stack.blocks.length >= 10}
                className="border bg-blue-500 text-white p-2 rounded-md disabled:opacity-50"
              >
                <PlusIcon className="w-8 h-8" />
              </button>
              <button 
                onClick={() => updateBlocks(index, false)} 
                disabled={stack.blocks.length <= 1}
                className="border bg-blue-500 text-white p-2 rounded-md disabled:opacity-50"
              >
                <MinusIcon className="w-8 h-8" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="text-2xl lg:text-2xl min-w-fit font-mono">
        <div className="grid grid-cols-[1fr_auto_1fr] gap-y-4">
          <h3 className="col-span-3 text-center">Block Settings</h3>
          
          <div className="flex flex-col gap-2 text-base lg:text-xl">
            <h4>Mode</h4>
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

          <div className="w-8" />

          <div className="flex flex-col gap-2 text-base lg:text-xl">
            <h4>Size</h4>
            <label className="flex items-center gap-2">
              <input 
                type="radio" 
                value="sm" 
                checked={blockSize === 'sm'} 
                onChange={() => setBlockSize('sm')}
              />
              Small
            </label>
            <label className="flex items-center gap-2">
              <input 
                type="radio" 
                value="lg" 
                checked={blockSize === 'lg'} 
                onChange={() => setBlockSize('lg')}
              />
              Large
            </label>
          </div>

          <h3 className="col-span-3 text-center mt-2">Animations</h3>

          <div className="flex flex-col gap-2 text-base lg:text-xl">
            <h4>Float</h4>
            <label className="flex items-center gap-2">
              <input 
                type="radio" 
                value="synced"
                checked={floatMode === 'synced'} 
                onChange={() => setFloatMode('synced')}
              />
              Synced
            </label>
            <label className="flex items-center gap-2">
              <input 
                type="radio" 
                value="staggered"
                checked={floatMode === 'staggered'} 
                onChange={() => setFloatMode('staggered')}
              />
              Staggered
            </label>
            <label className="flex items-center gap-2">
              <input 
                type="radio" 
                value="off"
                checked={floatMode === 'off'} 
                onChange={() => setFloatMode('off')}
              />
              Off
            </label>
          </div>

          <div className="w-8" />

          <div className="flex flex-col gap-2 text-base lg:text-xl">
            <h4>Shimmer</h4>
            <label className="flex items-center gap-2">
              <input 
                type="radio" 
                value="on"
                checked={shimmerEnabled} 
                onChange={() => setShimmerEnabled(true)}
              />
              On
            </label>
            <label className="flex items-center gap-2">
              <input 
                type="radio" 
                value="off"
                checked={!shimmerEnabled} 
                onChange={() => setShimmerEnabled(false)}
              />
              Off
            </label>
          </div>
        </div>
      </div>
      
        <div className="mt-8 text-center text-lg lg:text-xl h-20">
          <AnimatePresence mode="wait">
            {mode === 'addRemove' && (
              <motion.p
                key="addRemove"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.4 }}
              >
                Double click the stack to add a block, drag the top block to remove
              </motion.p>
            )}
            {mode === 'drawCompare' && (
              <motion.p
                key="drawCompare"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.4 }}
              >
                Click and drag from the top of one stack to the other to create a comparison line
              </motion.p>
            )}
          </AnimatePresence>
        </div>
    </div>
  )
}