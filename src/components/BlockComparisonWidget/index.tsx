import { useState, useRef, useEffect } from 'react'
import { BlockStack } from '../BlockStack'
import { ControlPanel } from '../ControlPanel'
import { ComparisonLayer } from '../ComparisonLine'
import type { InteractionMode, BlockStack as BlockStackType } from './types'
import type { ComparisonLine } from '../ComparisonLine'

const generateRandomLengths = () => {
  const length1 = Math.floor(Math.random() * 5) + 2; 
  let length2;
  do {
    length2 = Math.floor(Math.random() * 5) + 2;  
  } while (length2 === length1); 
  
  return [length1, length2];
};

export function BlockComparisonWidget() {
  const [initialStack1Length, initialStack2Length] = generateRandomLengths();
  const totalInitialBlocks = initialStack1Length + initialStack2Length;
  const containerRef = useRef<HTMLDivElement>(null);

  // core state
  const [blockIdCounter, setBlockIdCounter] = useState(totalInitialBlocks);
  const [stacks, setStacks] = useState<BlockStackType[]>([
    { 
      id: 1, 
      blocks: Array.from({ length: initialStack1Length }, (_, i) => ({ 
        id: `stack1-block-${i}`, 
        position: i 
      })), 
      value: 2, 
      mode: 'label' 
    },
    { 
      id: 2, 
      blocks: Array.from({ length: initialStack2Length }, (_, i) => ({ 
        id: `stack2-block-${i + initialStack1Length}`, 
        position: i 
      })), 
      value: 4, 
      mode: 'label' 
    }
  ]);
  
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
  
  // autocomparison effect
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
    shimmerEnabled,
    stacks.map(stack => stack.blocks.length).join(',') 
  ]);


  const hasExistingLine = (stackId: number, position: 'top' | 'bottom') => {
    return comparisonLines.some(line => 
      (line.startStack === stackId || line.endStack === stackId) && 
      line.position === position
    );
  };

  // event handlers
  // stack manipulation handlers
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

  // comparison handlers
  const handleContainerClick = (e: React.MouseEvent) => {
    // only handle clicks in compare mode and when there's an active comparison
    if (interactionMode === 'drawCompare' && activeComparison) {
      if (e.target === e.currentTarget) {
        setActiveComparison(null);
        setMousePosition(null);
      }
    }
  };

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
                
                // check if this position already has a line
                if (hasExistingLine(stack.id, position)) return;

                if (!activeComparison) {
                    const rect = containerRef.current?.getBoundingClientRect();
                    if (!rect) return;
                    
                    const startX = (rect.width / 3) * stack.id;
                    
                    // new comparison
                    setActiveComparison({
                        startStack: stack.id,
                        startPosition: position,
                        startY: y,
                        startX: startX
                    });
                    setMousePosition({
                        x: startX,
                        y: y
                    });
                } else if (
                    activeComparison.startStack !== stack.id && 
                    activeComparison.startPosition === position &&
                    !hasExistingLine(activeComparison.startStack, position)
                ) {
                    // Completing a comparison
                    const newLineId = `manual-comparison-${Date.now()}`;
                    setLineAnimations(prev => new Set(prev).add(newLineId));
                    
                    setComparisonLines(lines => [...lines, {
                        id: newLineId,
                        startStack: activeComparison.startStack,
                        endStack: stack.id,
                        position,
                        type: 'student'
                    }]);
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
        blockIdCounter={blockIdCounter}
        setBlockIdCounter={setBlockIdCounter}
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