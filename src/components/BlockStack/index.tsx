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
}

export function BlockStack({ stack, onStackClick, onStackUpdate, mode, blockSize, floatMode, shimmerEnabled, onConnectionPoint }: BlockStackProps) {
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
    if (isUpdatingRef.current) return;
    
    isUpdatingRef.current = true;
    
    // wait for React to finish updates
    requestAnimationFrame(() => {
      if (blocksContainerRef.current) {
        try {
            const positions = getStackBlockPositions(blocksContainerRef.current, INTERACTION_ZONE_OFFSET);
            const containerRect = blocksContainerRef.current.getBoundingClientRect();
          setZonePositions({
            top: positions.top - containerRect.top,
            bottom: positions.bottom - containerRect.top
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

    const observer = new MutationObserver(() => {
      if (!isUpdatingRef.current) {
        requestAnimationFrame(updatePositions);
      }
    });

    observer.observe(blocksContainerRef.current, {
      childList: true,
      subtree: true,
      attributes: true
    });

    updatePositions();

    return () => {
      observer.disconnect();
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

// wait i thinkthis is redundant check tomororw
  const hasLine = (_position: 'top' | 'bottom') => {
    return false; 
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
              draggable={index === 0 && stack.blocks.length > 1}
              onDragEnd={(event, info) => handleDragEnd(event, info, index)}
              size={blockSize}
              mode={mode}
              floatMode={floatMode}
              shimmerEnabled={shimmerEnabled}
              floatProgress={floatProgress}
            />
          ))}
        </AnimatePresence>
        {mode === 'drawCompare' && (
          <>
            {/* Define shared class strings */}
            {(() => {
              const baseZoneClasses = `
                absolute h-8 z-50
                before:absolute before:inset-0 before:opacity-0
                before:bg-gradient-to-r before:from-transparent before:via-blue-500/5 before:to-transparent
                after:absolute after:inset-0 after:opacity-0
                after:bg-blue-500/5 after:blur-md
                transition-all duration-300
              `;

              const innerGlowClasses = `
                absolute inset-0 opacity-0 
                bg-blue-500/5 blur-sm
                group-hover:opacity-100 transition-opacity duration-300
              `;

              const getHoverClasses = (hasLine: boolean) => 
                !hasLine 
                  ? 'hover:before:opacity-100 hover:after:opacity-100 cursor-crosshair' 
                  : 'cursor-not-allowed opacity-50';

              return (['top', 'bottom'] as const).map((position) => (
                <div 
                  key={position}
                  className={`${baseZoneClasses} ${getHoverClasses(hasLine(position))}`}
                  style={{
                    top: `${zonePositions[position]}px`,
                    transform: 'translateY(-50%)',
                    width: '100%',
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
              ));
            })()}
          </>
        )}
      </div>

      <div className="text-center mt-2 mb-10">
        <span className="text-6xl font-bold text-blue-400">
          {stack.blocks.length}
        </span>
      </div>
    </div>
  )
}