import { useState, useRef, useEffect } from 'react'
import { BlockStack } from '../BlockStack'
import { ControlPanel } from '../ControlPanel'
import { ComparisonLayer } from '../ComparisonLine'
import type { InteractionMode, BlockStack as BlockStackType } from './types'
import type { ComparisonLine } from '../ComparisonLine'
import { v4 as uuidv4 } from 'uuid'

// i did it with a custom function cuz i wanted the numbers to specifically be in the range of 2-6 and not the same
// reminder - math.random() returns a number between 0 and 1 , so we multiply it by 5 and round down, + 2 to raise eceilig/floor
const generateRandomLengths = () => {
  const length1 = Math.floor(Math.random() * 5) + 2; 
  let length2;
  do {
    length2 = Math.floor(Math.random() * 5) + 2;  
  } while (length2 === length1); 
  
  return [length1, length2];
};

// const generateInitialStacks = () => {
//   
// }

export function BlockComparisonWidget() {
  // im not doing anything with this state except using it when i create the blocks 
  // so i should just make like a generateInitialStacks function 
  const [initialStack1Length, initialStack2Length] = generateRandomLengths();
  // const totalInitialBlocks = initialStack1Length + initialStack2Length;
  const containerRef = useRef<HTMLDivElement>(null);

  // core state
  // const [blockIdCounter, setBlockIdCounter] = useState(totalInitialBlocks);
  // this is way ugly and would be simpler if i removed those uncessary attributes from the type 
  const [stacks, setStacks] = useState<BlockStackType[]>([
    { 
      id: 1, 
      blocks: Array.from({ length: initialStack1Length }, (_, i) => ({ 
        id: uuidv4(), 
        position: i 
      })), 
      value: 2, 
      mode: 'label' 
    },
    { 
      id: 2, 
      blocks: Array.from({ length: initialStack2Length }, (_, i) => ({ 
        id: uuidv4(), 
        position: i 
      })), 
      value: 4, 
      mode: 'label' 
    }
  ]);
  
  // could have used a context provider or global state 
  // NOT a hook despite andrew's suggestion - these states are shared, coordinates the app 
  // ui state
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('addRemove');
  const [blockSize, setBlockSize] = useState<'sm' | 'lg'>('sm');
  const [floatMode, setFloatMode] = useState<'synced' | 'staggered' | 'off'>('synced');
  const [shimmerEnabled, setShimmerEnabled] = useState(true);
  const [autoCompare, setAutoCompare] = useState(false);

  // comparison state
  const [comparisonLines, setComparisonLines] = useState<ComparisonLine[]>([]);
  const [activeComparison, setActiveComparison] = useState<{
    startStack: number;
    startPosition: 'top' | 'bottom';
    startY: number;
    startX: number;
  } | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  
  // animation state
  const [lineAnimations, setLineAnimations] = useState<Set<string>>(new Set());
  const [isAnimatingSymbol, setIsAnimatingSymbol] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  // effects
  // mouse tracking effect
  useEffect(() => {
    if (!activeComparison) return;

    const handleMouseMove = (e: MouseEvent) => {
      // get position relative to container
      if (containerRef.current) {
        // domrect object to get the position of the container
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
  
  // mode switching effect
  useEffect(() => {
    if (interactionMode === 'addRemove') {
      setComparisonLines([]);
      setActiveComparison(null);
      setMousePosition(null);
    }
  }, [interactionMode]);
  
  // initualize autocomparison effect 
  // tbh, i wish i made this effect triggered by a button isntead of listening for changes in the mode
  useEffect(() => {
    if (!autoCompare || interactionMode !== 'drawCompare') return;

    setComparisonLines([]);

    const topLineId = `auto-comparison-top-${Date.now()}`;
    const bottomLineId = `auto-comparison-bottom-${Date.now()}`;

    setLineAnimations(new Set([topLineId, bottomLineId]));

    const newLines = [
      {
        id: topLineId,
        startStack: 1,
        endStack: 2,
        position: 'top' as const,
        type: 'auto' as const
      },
      {
        id: bottomLineId,
        startStack: 1,
        endStack: 2,
        position: 'bottom' as const,
        type: 'auto' as const
      }
    ];

    setComparisonLines(newLines);
  }, [autoCompare, interactionMode]);
  
  // animation reset 
  useEffect(() => {
    setHasAnimated(false);
  }, [
    blockSize, 
    interactionMode, 
    stacks.map(stack => stack.blocks.length).join(',') 
  ]);


  // checks if there is an existing line at a given position, used for show/hide interaction zones in BS
  const hasExistingLine = (stackId: number, position: 'top' | 'bottom') => {
    return comparisonLines.some(line => 
      (line.startStack === stackId || line.endStack === stackId) && 
      line.position === position
    );
  };

  // event handlers
  // stack manipulation handlers
  // add new block when stack is double clicked
  const handleStackClick = (stackId: number) => {
    if (interactionMode === 'addRemove') {
      // new ID
      const newBlockId = uuidv4();
      
      // new block
      setStacks(stacks.map(stack => {
        if (stack.id === stackId && stack.blocks.length < 10) {
          const newBlock = {
            id: newBlockId,
            position: stack.blocks.length
          }
          return {
            ...stack,
            blocks: [...stack.blocks, newBlock]
          }
        }
        return stack
      }));
  
      // setBlockIdCounter(newBlockId + 1);
    }
  }

  // handles stack removing when dragging
  const handleStackUpdate = (stackId: number, removeIndex: number) => {
    setStacks(stacks.map(stack => {
      if (stack.id === stackId) {
        return {
          ...stack,
          blocks: stack.blocks.filter((_, index) => index !== removeIndex)
        }
      }
      return stack
    }))
  }

  // comparison handlers
  // ends the existing comparison when user clicks off (on the container, stack handled in onStackClick)
  const handleContainerClick = (e: React.MouseEvent) => {
    if (interactionMode === 'drawCompare' && activeComparison) {
      if (e.target === e.currentTarget) {
        setActiveComparison(null);
        setMousePosition(null);
      }
    }
  };


  // when a line animation completes, remove the line id from the set of animating lines
  const handleLineAnimationComplete = (lineId: string) => {
    setLineAnimations(prev => {
      const next = new Set(prev);
      next.delete(lineId);
      return next;
    });
  };
  
  // animation handlers
  const handleAnimateComparison = () => {
    setIsAnimatingSymbol(true);
    setHasAnimated(true);
  };

  const handleAnimationComplete = () => {
    setIsAnimatingSymbol(false);
  };

  const handleResetComparisons = () => {
    setComparisonLines([]);
    setHasAnimated(false);
  };

  return (
    <div className="w-full flex flex-col lg:flex-row gap-4 md:gap-6 p-4 md:p-6 lg:p-8 xl:w-[80vw] 2xl:w-[70vw] overflow-hidden relative">
      <div 
        ref={containerRef}
        className="bg-slate-900 rounded-xl p-4 md:p-6 h-[60vh] md:h-[85vh] w-full relative"
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
              //hahah why did i make this an inline function 
              onStackClick={() => {
                // this ends the existing comparison when user clicks off (on a stack)
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
              // woww this definitely should be pulled out into a separate function geez
              // better called handleComparisonLineConnection or something
              // event handler for clicking on an interaction zone
              onConnectionPoint={(position, y) => {
                if (interactionMode !== 'drawCompare') return;
                if (hasExistingLine(stack.id, position)) return;

                // start new active comparison if none 
                if (!activeComparison) {
                  // get containers dimensions for accurate positioning
                    const rect = containerRef.current?.getBoundingClientRect();
                    if (!rect) return;
                    
                    const startX = (rect.width / 3) * stack.id;
                    
                    // starting point of the comparison
                    setActiveComparison({
                        startStack: stack.id,
                        startPosition: position,
                        startY: y,
                        startX: startX
                    });
                    // set mouse position to the starting point of the comparison
                    setMousePosition({
                        x: startX,
                        y: y
                    });
                // alternate case - compelting active comparison (click on other stack)
                } else if (
                    activeComparison.startStack !== stack.id && 
                    activeComparison.startPosition === position &&
                    !hasExistingLine(activeComparison.startStack, position)
                ) {
                    const newLineId = `manual-comparison-${Date.now()}`;
                    setLineAnimations(prev => new Set(prev).add(newLineId));
                    
                    setComparisonLines(lines => [...lines, {
                        id: newLineId,
                        startStack: activeComparison.startStack,
                        endStack: stack.id,
                        position,
                        type: 'student'
                    }]);

                    // reset active comparison (line complete)
                    setActiveComparison(null);
                    setMousePosition(null);
                }
              }}
              activeComparison={activeComparison ? {
                startStack: activeComparison.startStack,
                startPosition: activeComparison.startPosition
              } : null}
              hasExistingLine={hasExistingLine}
            />
          ))}
          
          <ComparisonLayer
            comparisonLines={comparisonLines}
            activeComparison={activeComparison}
            mousePosition={mousePosition}
            containerRef={containerRef}
            isAnimating={isAnimatingSymbol}
            stackSizes={{
              1: stacks[0].blocks.length,
              2: stacks[1].blocks.length
            }}
            onAnimationComplete={handleAnimationComplete}
            onLineAnimationComplete={handleLineAnimationComplete}
            animatingLines={lineAnimations}
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
        floatMode={floatMode}
        setFloatMode={setFloatMode}
        shimmerEnabled={shimmerEnabled}
        setShimmerEnabled={setShimmerEnabled}
        comparisonLines={comparisonLines}
        onResetComparisons={handleResetComparisons}
        autoCompare={autoCompare}
        setAutoCompare={setAutoCompare}
        handleAnimateComparison={handleAnimateComparison}
        isAnimating={isAnimatingSymbol}
        hasAnimated={hasAnimated}
      />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 md:left-8 md:translate-x-0 lg:left-12 text-xs text-slate-500">
        Made with ♡ by <a href="http://hyperdiscogirl.netlify.app" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300">Disco</a>
      </div>
    </div>
  )
}