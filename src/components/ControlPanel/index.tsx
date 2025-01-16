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
  autoCompare: boolean
  setAutoCompare: (enabled: boolean) => void
  handleAnimateComparison: () => void
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
  onResetComparisons,
  autoCompare,
  setAutoCompare,
  handleAnimateComparison
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
    <div className="bg-slate-900 rounded-xl text-sky-100 text-sm p-4 px-20 py-10 lg:py-0 lg:pt-0 lg:p-6 xl:p-12 
                    lg:h-[85vh] w-full min-h-fit lg:min-h-0 lg:w-[45%] flex flex-col justify-center 
                    items-center gap-4 overflow-y-auto md:overflow-x-auto overflow-x-hidden">
      <h2 className="font-bold font-mono text-center text-sky-100 whitespace-nowrap flex items-center text-3xl">
        <WrenchIcon 
          className="w-6 h-6 inline-block align-middle mr-2" 
          fill="#e0e7ff"
        />
        Control Panel
      </h2>
      <div className="flex min-w-fit justify-center gap-5 text-sky-400">
        {stacks.map((stack, index) => (
          <div key={stack.id} className="flex flex-col items-center gap-4">
            <select 
              value={stack.blocks.length} 
              onChange={(e) => handleSelectChange(index, parseInt(e.target.value))}
              className="bg-slate-700 text-white p-2 rounded-md text-2xl text-center w-full"
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
                className="bg-sky-500 text-white p-2 rounded-md disabled:opacity-50 
                          disabled:hover:bg-sky-500 hover:bg-sky-600 transition-colors
                          shadow-sm shadow-sky-100"
              >
                <PlusIcon className="w-8 h-8" />
              </button>
              <button 
                onClick={() => updateBlocks(index, false)} 
                disabled={stack.blocks.length <= 1 || mode === 'drawCompare'}
                className="bg-sky-500 text-white p-2 rounded-md disabled:opacity-50 
                          disabled:hover:bg-sky-500 hover:bg-sky-600 transition-colors
                          shadow-sm shadow-sky-100"
              >
                <MinusIcon className="w-8 h-8" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="text-lg min-w-fit font-mono">
        <div className="grid grid-cols-[1fr_auto_1fr] gap-y-2">
          <h3 className="col-span-3 text-center">Block Settings</h3>
          
          <div className="flex flex-col gap-2 text-base lg:text-lg">
            <h4>Mode</h4>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                value="addRemove" 
                checked={mode === 'addRemove'} 
                onChange={() => setMode('addRemove')}
                className="accent-sky-500"
              />
              Add/Remove
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                value="drawCompare" 
                checked={mode === 'drawCompare'} 
                onChange={() => setMode('drawCompare')}
                className="accent-sky-500"
              />
              Draw/Compare
            </label>
          </div>

          <div className="w-8" />

          <div className="flex flex-col gap-2 text-base lg:text-lg">
            <h4>Size</h4>
            <label className={`flex items-center gap-2 
              ${hasActiveComparisons 
                ? 'opacity-50 hover:opacity-50' 
                : 'cursor-pointer hover:opacity-80'
              }`}>
              <input 
                type="radio" 
                value="sm" 
                checked={blockSize === 'sm'} 
                onChange={() => setBlockSize('sm')}
                disabled={hasActiveComparisons}
                className="accent-sky-500"
              />
              Small
            </label>
            <label className={`flex items-center gap-2 
              ${hasActiveComparisons 
                ? 'opacity-50 hover:opacity-50' 
                : 'cursor-pointer hover:opacity-80'
              }`}>
              <input 
                type="radio" 
                value="lg" 
                checked={blockSize === 'lg'} 
                onChange={() => setBlockSize('lg')}
                disabled={hasActiveComparisons}
                className="accent-sky-500"
              />
              Large
            </label>
          </div>

          <h3 className="col-span-3 text-center">Animations</h3>

          <div className="flex flex-col gap-2 text-base lg:text-lg">
            <h4>Float</h4>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                value="synced"
                checked={floatMode === 'synced'} 
                onChange={() => setFloatMode('synced')}
                className="accent-sky-500"
              />
              Synced
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                value="staggered"
                checked={floatMode === 'staggered'} 
                onChange={() => setFloatMode('staggered')}
                className="accent-sky-500"
              />
              Staggered
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                value="off"
                checked={floatMode === 'off'} 
                onChange={() => setFloatMode('off')}
                className="accent-sky-500"
              />
              Off
            </label>
          </div>

          <div className="w-8" />

          <div className="flex flex-col gap-2 text-base lg:text-lg">
            <h4>Shimmer</h4>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                value="on"
                checked={shimmerEnabled} 
                onChange={() => setShimmerEnabled(true)}
                className="accent-sky-500"
              />
              On
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                value="off"
                checked={!shimmerEnabled} 
                onChange={() => setShimmerEnabled(false)}
                className="accent-sky-500"
              />
              Off
            </label>
          </div>
        </div>
        <label className="col-span-3 flex items-center gap-2 cursor-pointer justify-center mt-2 text-base lg:text-lg">
              <input 
                type="checkbox"
                checked={autoCompare}
                onChange={(e) => setAutoCompare(e.target.checked)}
                className="accent-sky-500"
              />
              Auto-Compare
            </label>
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
                  className="px-3 py-2 bg-sky-500 rounded-md hover:bg-sky-600 flex items-center gap-2
                            shadow-sm shadow-sky-100"
                >
                  <XIcon className="w-5 h-5" />
                  Reset
                </button>
                <button 
                  onClick={handleAnimateComparison}
                  className="animate-shimmer px-3 py-2 rounded-md
                    bg-sky-500 relative overflow-hidden hover:bg-sky-600
                    shadow-sm shadow-sky-100
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
                  {(() => {
                    if (mode === 'addRemove') {
                      return (
                        <p>
                          <InfoIcon className="w-6 h-6 inline-block align-middle mr-2" />
                          Double click the stack to add a block, drag the top block to remove
                        </p>
                      );
                    }
                    if (!autoCompare) {
                      return (
                        <p>
                          <InfoIcon className="w-6 h-6 inline-block align-middle mr-2" />
                          Click at the same end of each stack to draw a comparison line
                        </p>
                      );
                    }
                    return null;
                  })()}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
    </div>
  )
}