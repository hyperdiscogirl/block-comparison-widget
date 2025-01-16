import { useMotionValue, AnimatePresence, PanInfo } from 'framer-motion'
import { useEffect, useRef, useState, useCallback } from 'react'
import { Block as BlockComponent } from '../Block'
import type { BlockStack as BlockStackType } from '../BlockComparisonWidget/types'
import { getStackBlockPositions } from '../../utils/stackPositioning'

interface BlockStackProps {
  stack: BlockStackType;
  onStackClick?: () => void;
  onStackUpdate?: (removeIndex: number) => void;
  mode: 'addRemove' | 'drawCompare';
  blockSize: 'sm' | 'lg';
  floatMode: 'synced' | 'staggered' | 'off';
  shimmerEnabled: boolean;
  onConnectionPoint?: (position: 'top' | 'bottom', y: number) => void;
  activeComparison?: {
    startStack: number;
    startPosition: 'top' | 'bottom';
  } | null;
  hasExistingLine: (stackId: number, position: 'top' | 'bottom') => boolean;
}

export function BlockStack({ stack, onStackClick, onStackUpdate, mode, blockSize, floatMode, shimmerEnabled, onConnectionPoint, activeComparison, hasExistingLine }: BlockStackProps) {
  const blocksContainerRef = useRef<HTMLDivElement>(null);
  const [zonePositions, setZonePositions] = useState({ top: 0, bottom: 0 });

  const INTERACTION_ZONE_OFFSET = 12; 
  
  // track if currently processing an update
  const isUpdatingRef = useRef(false);

  // create a shared motion value to sync animation
  const floatProgress = useMotionValue(0)
  
  // start the animation cycle when component mounts
  useEffect(() => {
    if (floatMode === 'off') return;
    
    const animate = () => {
      const time = (Date.now() / 2000) % 1
      floatProgress.set(time)
      requestAnimationFrame(animate)
    }
    
    const animation = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animation)
  }, [floatMode])

  // debounce our position updates to prevent overwhelm the browser
  const updatePositions = useCallback(() => {
    console.log('updating positions called', activeComparison);
    if (isUpdatingRef.current) return;
    
    isUpdatingRef.current = true;
    
    // wait for React to finish updates
    requestAnimationFrame(() => {
      if (blocksContainerRef.current) {
        try {
          const positions = getStackBlockPositions(blocksContainerRef.current, INTERACTION_ZONE_OFFSET);
          const containerRect = blocksContainerRef.current.getBoundingClientRect();
          
          // Only update if positions have actually changed
          setZonePositions(prev => {
            const newTop = positions.top - containerRect.top;
            const newBottom = positions.bottom - containerRect.top;
            if (prev.top === newTop && prev.bottom === newBottom) {
              return prev;
            }
            return { top: newTop, bottom: newBottom };
          });
        } catch (error) {
          console.error('Error updating positions:', error);
        } finally {
          isUpdatingRef.current = false;
        }
      }
    });
  }, []);

  useEffect(() => {
    if (!blocksContainerRef.current) return;

    let timeoutId: number;
    const observer = new MutationObserver(() => {
      if (!isUpdatingRef.current) {
        // Debounce the updates
        window.clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => {
          requestAnimationFrame(updatePositions);
        }, 100);
      }
    });

    observer.observe(blocksContainerRef.current, {
      childList: true,
      subtree: true,
      attributes: true
    });

    // Initial position calculation
    updatePositions();

    return () => {
      observer.disconnect();
      window.clearTimeout(timeoutId);
      isUpdatingRef.current = false;
    };
  }, [updatePositions]);

  // Add separate effect for size/mode changes
  useEffect(() => {
    updatePositions();
  }, [blockSize, floatMode, updatePositions]);

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo, index: number) => {
    const distanceMoved = Math.sqrt(info.offset.x ** 2 + info.offset.y ** 2);
    const deleteThreshold = 100;

    if (index === 0 && distanceMoved > deleteThreshold) {
      onStackUpdate?.(index);
    }
  };

  const hasLine = (position: 'top' | 'bottom') => {
    return hasExistingLine(stack.id, position);
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    if (mode === 'drawCompare') {
      const isInteractionZone = (e.target as HTMLElement).classList.contains('interaction-zone');
      if (!isInteractionZone) {
        onStackClick?.();
      } 
    }
  };

  return (
    <div 
      className="w-32 h-full flex flex-col justify-between relative"
      onDoubleClick={mode === 'addRemove' ? onStackClick : undefined}
      onClick={handleContainerClick}
    >
      <div 
        ref={blocksContainerRef}
        className="relative flex-grow flex flex-col items-center justify-center"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {stack.blocks.map((block, index) => (
            <BlockComponent 
              key={block.id}
              index={index}
              totalBlocks={stack.blocks.length}
              draggable={index === 0 && stack.blocks.length > 1 && mode === 'addRemove'}
              onDragEnd={(event, info) => handleDragEnd(event, info, index)}
              size={blockSize}
              mode={mode}
              floatMode={floatMode}
              shimmerEnabled={shimmerEnabled}
              floatProgress={floatProgress}
            />
          ))}
        </AnimatePresence>
        {mode === 'drawCompare' && (!hasLine('top') || !hasLine('bottom')) && (
          <>
            {/* Define shared class strings */}
            {(() => {
              const baseZoneClasses = `
                absolute ${blockSize === 'lg' ? 'h-24 w-24' : 'h-16 w-16'} z-0 mx-auto left-0 right-0
                rounded-[999px] overflow-hidden
                before:absolute before:inset-0 before:opacity-0
                before:bg-gradient-to-r before:from-transparent before:via-sky-500/5 before:to-transparent
                after:absolute after:inset-0 after:opacity-0
                after:bg-sky-700/40 after:blur-xl
                transition-all duration-500
              `;

              const innerGlowClasses = `
                absolute  opacity-0 
                bg-sky-500/5 blur-xl rounded-[999px]
                group-hover:opacity-100 transition-opacity duration-300
              `;

              const getHoverClasses = (hasLine: boolean) => 
                !hasLine 
                  ? 'hover:before:opacity-100 hover:after:opacity-100 cursor-crosshair' 
                  : 'cursor-not-allowed opacity-50';

              return (['top', 'bottom'] as const).map((position) => {
                // only show zones based on active comparison state
                const shouldShowZone = () => {
                  if (!activeComparison) return true;
                  if (stack.id === activeComparison.startStack) return false;
                  return position === activeComparison.startPosition;
                };

                if (!shouldShowZone()) return null;

                return (
                  <div 
                    key={position}
                    className={`${baseZoneClasses} ${getHoverClasses(hasLine(position))} group interaction-zone`}
                    style={{
                      top: `${zonePositions[position]}px`,
                      transform: 'translateY(-50%)',
                    }}
                    onClick={(e) => {
                      if (hasLine(position)) return;
                      e.stopPropagation();
                      const rect = e.currentTarget.getBoundingClientRect();
                      onConnectionPoint?.(position, rect.top + rect.height/2);
                    }}
                  >
                    <div className={innerGlowClasses} />
                  </div>
                );
              }).filter(Boolean);
            })()}
          </>
        )}
      </div>

      <div className="text-center mt-2 mb-10">
        <span className="text-6xl font-bold text-sky-400" >
          {stack.blocks.length}
        </span>
      </div>
    </div>
  )
}