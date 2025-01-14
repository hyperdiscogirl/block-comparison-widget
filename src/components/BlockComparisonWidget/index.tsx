import { useState } from 'react'
import { BlockStack } from '../BlockStack'
import { ControlPanel } from '../ControlPanel'
import type { InteractionMode, BlockStack as BlockStackType } from './types'

export function BlockComparisonWidget() {
 // purpose of this is to generate unique ids for the blocks
 const initialStack1Length = 5;
 const initialStack2Length = 2;
 const totalInitialBlocks = initialStack1Length + initialStack2Length;

 // initialize counter to start after all our initial blocks
 const [blockIdCounter, setBlockIdCounter] = useState(totalInitialBlocks);

 // create our initial stacks with sequential IDs
 const [stacks, setStacks] = useState<BlockStackType[]>([
   { 
     id: 1, 
     blocks: Array.from({ length: initialStack1Length }, (_, i) => ({ 
       // First stack blocks will have IDs 0 through 4
       id: `stack1-block-${i}`, 
       position: i 
     })), 
     value: 2, 
     mode: 'label' 
   },
   { 
     id: 2, 
     blocks: Array.from({ length: initialStack2Length }, (_, i) => ({ 
       // second stack blocks will have IDs 5 and 6
       // add initialStack1Length to ensure no overlap with first stack
       id: `stack2-block-${i + initialStack1Length}`, 
       position: i 
     })), 
     value: 4, 
     mode: 'label' 
   }
 ]);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('addRemove')
  const [blockSize, setBlockSize] = useState<'sm' | 'lg'>('sm');

  const handleStackClick = (stackId: number) => {
    if (interactionMode === 'addRemove') {
      // new ID
      const newBlockId = blockIdCounter;
      
      // new block
      setStacks(stacks.map(stack => {
        if (stack.id === stackId && stack.blocks.length < 10) {
          const newBlock = {
            id: `stack${stackId}-block-${newBlockId}`,
            position: stack.blocks.length
          }
          return {
            ...stack,
            blocks: [...stack.blocks, newBlock]
          }
        }
        return stack
      }));
  
      // update the counter after we've used the ID
      setBlockIdCounter(newBlockId + 1);
    }
  }

  const handleStackUpdate = (stackId: number, removeIndex: number) => {
    setStacks(stacks.map(stack => {
      if (stack.id === stackId) {
        // remove block at specific index (usually top)
        return {
          ...stack,
          blocks: stack.blocks.filter((_, index) => index !== removeIndex)
        }
      }
      return stack
    }))
  }

  return (
    <div className="w-full flex flex-col md:flex-row gap-4 md:gap-6 p-4 md:p-6 lg:p-8 overflow-hidden">
      <div className="bg-slate-800 rounded-xl shadow-xl p-4 md:p-6 h-[60vh] md:h-[85vh] w-full">
        <div className="flex h-full justify-around px-4">
          {stacks.map(stack => (
            <BlockStack
              key={stack.id}
              stack={stack}
              onStackClick={() => handleStackClick(stack.id)}
              onStackUpdate={(removeIndex) => handleStackUpdate(stack.id, removeIndex)}
              mode={interactionMode}
              blockSize={blockSize}
            />
          ))}
        </div>
      </div>
      <ControlPanel 
        stacks={stacks}
        setStacks={setStacks}
        mode={interactionMode}
        setMode={setInteractionMode}
        blockSize={blockSize}
        setBlockSize={setBlockSize}
        blockIdCounter={blockIdCounter}
        setBlockIdCounter={setBlockIdCounter}
      />
    </div>
  )
}