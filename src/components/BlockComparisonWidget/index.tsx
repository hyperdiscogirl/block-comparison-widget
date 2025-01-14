import { useState } from 'react'
import { BlockStack } from '../BlockStack'
import { ControlPanel } from '../ControlPanel'
import type { InteractionMode, BlockStack as BlockStackType } from './types'

export function BlockComparisonWidget() {
  const [stacks, setStacks] = useState<BlockStackType[]>([
    { id: 1, blocks: 5, value: 2, mode: 'label' },
    { id: 2, blocks: 2, value: 4, mode: 'label' }
  ])
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('addRemove')


  const handleStackClick = (stackId: number) => {
    if (interactionMode === 'addRemove') {
      setStacks(stacks.map(stack => {
        if (stack.id === stackId) {
          return { ...stack, blocks: Math.min(stack.blocks + 1, 10) };
        }
        return stack;
      }));
    }
  };

  const handleStackUpdate = (stackId: number, newBlockCount: number) => {
    setStacks(stacks.map(stack => {
      if (stack.id === stackId) {
        return { ...stack, blocks: Math.max(1, newBlockCount) };
      }
      return stack;
    }));
  };

  const maxBlocks = Math.max(stacks[0].blocks, stacks[1].blocks)

  return (
    <div className="w-full max-w-2xl flex justify-evenly">
      <div className="bg-slate-800 rounded-lg shadow-xl p-6 h-[90vh]">
        <div className="flex justify-between h-full px-12">
          {stacks.map(stack => (
            <BlockStack
              key={stack.id}
              stack={stack}
              maxBlocks={maxBlocks}
              onStackClick={() => handleStackClick(stack.id)}
              onStackUpdate={(newBlockCount) => handleStackUpdate(stack.id, newBlockCount)}
            />
          ))}
        </div>
      </div>
      <div className="flex justify-between items-center">
        <ControlPanel 
          stacks={stacks}
          setStacks={setStacks}
          mode={interactionMode}
          setMode={setInteractionMode}
        />
      </div>
    </div>
  )
}