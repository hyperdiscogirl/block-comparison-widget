import type { BlockStack } from '../BlockComparisonWidget/types'
import { PlusIcon, MinusIcon, WrenchIcon, InfoIcon, XIcon, PlayIcon } from 'lucide-react'
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
  comparisonLines: any[]
  onResetComparisons: () => void
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
  setShimmerEnabled,
  comparisonLines,
  onResetComparisons
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

  const hasActiveComparisons = comparisonLines.length > 0;
  return (
    <div className="bg-slate-800 rounded-xl shadow-xl text-indigo-100 text-xl lg:text-2xl p-4 px-20 pt-10 lg:pt-0 lg:p-6 xl:p-12 lg:h-[85vh] w-full min-h-fit lg:min-h-0 lg:w-[45%] flex flex-col justify-center items-center gap-4 lg:gap-6 overflow-y-auto">
      <h2 className="font-bold font-mono text-center text-indigo-100 flex items-center justify-center gap-4 text-3xl lg:text-4xl">
        <WrenchIcon/>
        Controls <WrenchIcon className="transform scale-x-[-1]"/>
      </h2>
      <div className="flex min-w-fit justify-center gap-5 text-blue-400">
        {stacks.map((stack, index) => (
          <div key={stack.id} className="flex flex-col items-center gap-4">
            <select 
              value={stack.blocks.length} 
              onChange={(e) => handleSelectChange(index, parseInt(e.target.value))}
              className="bg-slate-700 text-white p-2 rounded-md text-center w-full"
              disabled={mode === 'drawCompare'}
            >
              {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
            <div className="flex justify-center gap-1">
              <button 
                onClick={() => updateBlocks(index, true)} 
                disabled={stack.blocks.length >= 10 || mode === 'drawCompare'}
                className="border bg-blue-500 text-white p-2 rounded-md disabled:opacity-50 
                          disabled:hover:bg-blue-500 hover:bg-blue-600 transition-colors"
              >
                <PlusIcon className="w-8 h-8" />
              </button>
              <button 
                onClick={() => updateBlocks(index, false)} 
                disabled={stack.blocks.length <= 1 || mode === 'drawCompare'}
                className="border bg-blue-500 text-white p-2 rounded-md disabled:opacity-50 
                          disabled:hover:bg-blue-500 hover:bg-blue-600 transition-colors"
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
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                value="addRemove" 
                checked={mode === 'addRemove'} 
                onChange={() => setMode('addRemove')}
              />
              Add/Remove
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
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
            <label className={`flex items-center gap-2 
              ${hasActiveComparisons 
                ? 'cursor-not-allowed opacity-50 hover:opacity-50' 
                : 'cursor-pointer hover:opacity-80'
              }`}>
              <input 
                type="radio" 
                value="sm" 
                checked={blockSize === 'sm'} 
                onChange={() => setBlockSize('sm')}
                disabled={hasActiveComparisons}
                className="disabled:cursor-not-allowed"
              />
              Small
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
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
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                value="synced"
                checked={floatMode === 'synced'} 
                onChange={() => setFloatMode('synced')}
              />
              Synced
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                value="staggered"
                checked={floatMode === 'staggered'} 
                onChange={() => setFloatMode('staggered')}
              />
              Staggered
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
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
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                value="on"
                checked={shimmerEnabled} 
                onChange={() => setShimmerEnabled(true)}
              />
              On
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
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
      
        <div className="text-center text-lg font-mono h-20">
          <AnimatePresence mode="wait">
            {comparisonLines.length === 2 ? (
              <motion.div
                key="comparison-controls"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.4 }}
                className="flex gap-3 justify-center"
              >
                <button 
                  onClick={onResetComparisons}
                  className="px-3 py-2 border bg-blue-500 rounded-md hover:bg-blue-600 flex items-center gap-2"
                >
                  <XIcon className="w-5 h-5" />
                  Reset
                </button>
                <button 
                  onClick={() => {/* animation logic */}}
                  className="animate-shimmer px-3 py-2 rounded-md border
                    bg-blue-500 relative overflow-hidden hover:bg-blue-600
                    before:absolute before:inset-0
                    before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent
                    before:translate-x-[-150%] before:animate-[shimmer_2s_infinite]
                    flex items-center gap-2"
                >
                  <PlayIcon className="w-5 h-5" />
                  Animate
                </button>
              </motion.div>
            ) : (
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.4 }}
              >
                <p>
                  <InfoIcon className="w-6 h-6 inline-block align-middle mr-2" />
                  {mode === 'addRemove' 
                    ? 'Double click the stack to add a block, drag the top block to remove'
                    : 'Click and mouse from the end of one stack to the other and click to create a comparison line'
                  }
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
    </div>
  )
}