import { useState, useRef, useEffect } from 'react'
import { BlockStack } from '../BlockStack'
import { ControlPanel } from '../ControlPanel'
import { ComparisonLayer } from '../ComparisonLine'
import type { InteractionMode, BlockStack as BlockStackType } from './types'
import type { ComparisonLine } from '../ComparisonLine'

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
  const [floatMode, setFloatMode] = useState<'synced' | 'staggered' | 'off'>('synced');
  const [shimmerEnabled, setShimmerEnabled] = useState(true);

  // Add new state for comparisons
  const [comparisonLines, setComparisonLines] = useState<ComparisonLine[]>([]);
  const [activeComparison, setActiveComparison] = useState<{
    startStack: number;
    startPosition: 'top' | 'bottom';
    startY: number;
  } | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  
  // Reference to our container for position calculations
  const containerRef = useRef<HTMLDivElement>(null);

  // Track mouse position during comparison drawing
  useEffect(() => {
    if (!activeComparison) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Get position relative to our container
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [activeComparison]);

  // Add debug logging to help us see what's happening
  console.log('Active comparison:', activeComparison);
  console.log('Mouse position:', mousePosition);
  console.log('Comparison lines:', comparisonLines);

  // Clear comparison state when switching to addRemove mode
  useEffect(() => {
    if (interactionMode === 'addRemove') {
      setComparisonLines([]);
      setActiveComparison(null);
      setMousePosition(null);
    }
  }, [interactionMode]);

  // Helper to check if a position already has a line
  const hasExistingLine = (stackId: number, position: 'top' | 'bottom') => {
    return comparisonLines.some(line => 
      (line.startStack === stackId || line.endStack === stackId) && 
      line.position === position
    );
  };

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

  // Add click handler for the container
  const handleContainerClick = (e: React.MouseEvent) => {
    // Only handle clicks in compare mode and when there's an active comparison
    if (interactionMode === 'drawCompare' && activeComparison) {
      // Check if the click was directly on the container or blocks container
      if (e.target === e.currentTarget) {
        setActiveComparison(null);
        setMousePosition(null);
      }
    }
  };

  return (
    <div className="w-full flex flex-col lg:flex-row gap-4 md:gap-6 p-4 md:p-6 lg:p-8 xl:w-[80vw] 2xl:w-[70vw] overflow-hidden">
      <div 
        ref={containerRef}
        className="bg-slate-800 rounded-xl shadow-xl p-4 md:p-6 h-[60vh] md:h-[85vh] w-full relative"
        onClick={handleContainerClick}
      >
        <div 
          className="flex h-full justify-around px-4"
          onClick={handleContainerClick}
        >
          {stacks.map(stack => (
            <BlockStack
              key={stack.id}
              stack={stack}
              onStackClick={() => {
                if (interactionMode === 'drawCompare' && activeComparison) {
                  setActiveComparison(null);
                  setMousePosition(null);
                } else if (interactionMode === 'addRemove') {
                  handleStackClick(stack.id);
                }
              }}
              onStackUpdate={(removeIndex) => handleStackUpdate(stack.id, removeIndex)}
              mode={interactionMode}
              blockSize={blockSize}
              floatMode={floatMode}
              shimmerEnabled={shimmerEnabled}
              onConnectionPoint={(position, y) => {
                if (interactionMode !== 'drawCompare') return;
                
                // Check if this position already has a line
                if (hasExistingLine(stack.id, position)) return;

                if (!activeComparison) {
                  // Start new comparison
                  setActiveComparison({
                    startStack: stack.id,
                    startPosition: position,
                    startY: y
                  });
                } else if (
                  activeComparison.startStack !== stack.id && 
                  activeComparison.startPosition === position &&
                  !hasExistingLine(activeComparison.startStack, position)
                ) {
                  // Complete valid comparison
                  setComparisonLines(lines => [...lines, {
                    id: `comparison-${Date.now()}`,
                    startStack: activeComparison.startStack,
                    endStack: stack.id,
                    position,
                    type: 'student'
                  }]);
                  setActiveComparison(null);
                }
              }}
            />
          ))}
          
          <ComparisonLayer
            comparisonLines={comparisonLines}
            activeComparison={activeComparison}
            mousePosition={mousePosition}
            containerRef={containerRef}
          />
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
        floatMode={floatMode}
        setFloatMode={setFloatMode}
        shimmerEnabled={shimmerEnabled}
        setShimmerEnabled={setShimmerEnabled}
        comparisonLines={comparisonLines}
        onResetComparisons={() => setComparisonLines([])}
      />
    </div>
  )
}