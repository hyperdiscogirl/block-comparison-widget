import { useMotionValue, AnimatePresence, PanInfo } from 'framer-motion';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Block as BlockComponent } from '../Block';
import type { BlockStack as BlockStackType } from '../BlockComparisonWidget/types';
import { getStackBlockPositions } from '../../utils/stackPositioning';
import { motion } from 'framer-motion';

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

export function BlockStack({
  stack,
  onStackClick,
  onStackUpdate,
  mode,
  blockSize,
  floatMode,
  shimmerEnabled,
  onConnectionPoint,
  activeComparison,
  hasExistingLine
}: BlockStackProps) {
  const blocksContainerRef = useRef<HTMLDivElement>(null);
  const isUpdatingRef = useRef(false);
  const exitingBlockRef = useRef<string | null>(null);
  const previousBlockCountRef = useRef(stack.blocks.length);
  const INTERACTION_ZONE_OFFSET = 12;

  const [zonePositions, setZonePositions] = useState({ top: 0, bottom: 0 });
  const [isExiting, setIsExiting] = useState(false);
  const floatProgress = useMotionValue(0);

  const hasLine = (position: 'top' | 'bottom') => {
    return hasExistingLine(stack.id, position);
  };

  const updatePositions = useCallback(() => {
    if (isUpdatingRef.current) return;
    
    isUpdatingRef.current = true;

    const updateOnce = () => {
      if (!blocksContainerRef.current) return;

      try {
        const positions = getStackBlockPositions(blocksContainerRef.current, INTERACTION_ZONE_OFFSET);
        const containerRect = blocksContainerRef.current.getBoundingClientRect();

        setZonePositions(prev => {
          const newTop = positions.top - containerRect.top;
          const newBottom = positions.bottom - containerRect.top;

          if (Math.abs(prev.top - newTop) > 1 || Math.abs(prev.bottom - newBottom) > 1) {
            console.log(`[Stack ${stack.id}] Position changed:`, {
              prev,
              new: { top: newTop, bottom: newBottom },
              blocks: stack.blocks.length
            });
            return { top: newTop, bottom: newBottom };
          }
          return prev;
        });
      } catch (error) {
        console.error('Error updating positions:', error);
      }
    };

    requestAnimationFrame(() => {
      updateOnce();
      setTimeout(() => {
        updateOnce();
        isUpdatingRef.current = false;
      }, 50);
    });
  }, [stack.id, stack.blocks.length, INTERACTION_ZONE_OFFSET]);

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo, index: number) => {
    const distanceMoved = Math.sqrt(info.offset.x ** 2 + info.offset.y ** 2);
    const deleteThreshold = 100;

    if (index === 0 && distanceMoved > deleteThreshold) {
      setIsExiting(true);
      exitingBlockRef.current = stack.blocks[0].id;
      
      setTimeout(() => {
        onStackUpdate?.(index);
        setIsExiting(false);
        exitingBlockRef.current = null;
        updatePositions();
      }, 200);
    }
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    if (mode === 'drawCompare') {
      const isInteractionZone = (e.target as HTMLElement).classList.contains('interaction-zone');
      if (!isInteractionZone) {
        onStackClick?.();
      }
    }
  };

  useEffect(() => {
    if (floatMode === 'off') return;

    const animate = () => {
      const time = (Date.now() / 2000) % 1;
      floatProgress.set(time);
      requestAnimationFrame(animate);
    };

    const animation = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animation);
  }, [floatMode]);

  useEffect(() => {
    const blockCountChanged = previousBlockCountRef.current !== stack.blocks.length;
    previousBlockCountRef.current = stack.blocks.length;

    if (blockCountChanged) {
      updatePositions();
    }
  }, [stack.blocks.length, stack.id, updatePositions]);

  useEffect(() => {
    updatePositions();
  }, [blockSize, floatMode, mode, updatePositions]);

  useEffect(() => {
    if (!blocksContainerRef.current) return;

    let pendingUpdateTimeout: number;

    const observer = new MutationObserver((mutations) => {
      if (isUpdatingRef.current) return;

      const hasRelevantChanges = mutations.some(mutation => 
        mutation.type === 'childList' || 
        (mutation.type === 'attributes' && 
         (mutation.attributeName === 'style' || mutation.attributeName === 'class'))
      );

      if (hasRelevantChanges) {
        window.clearTimeout(pendingUpdateTimeout);
        pendingUpdateTimeout = window.setTimeout(() => {
          updatePositions();
        }, 50);
      }
    });

    observer.observe(blocksContainerRef.current, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    updatePositions();

    return () => {
      observer.disconnect();
      window.clearTimeout(pendingUpdateTimeout);
      isUpdatingRef.current = false;
    };
  }, [stack.id, blockSize, updatePositions]);

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
              data-block-id={block.id}
              index={index}
              totalBlocks={stack.blocks.length}
              draggable={!isExiting && index === 0 && stack.blocks.length > 1 && mode === 'addRemove'}
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
            {(() => {
              const baseZoneClasses = `
                absolute 
                ${blockSize === 'lg' ? 'h-24 w-24' : 'h-16 w-16'}
                z-0 mx-auto left-0 right-0 rounded-[999px] overflow-hidden
                before:absolute before:inset-0 before:opacity-90 
                before:bg-gradient-to-r before:from-transparent before:via-sky-500/5 before:to-transparent
                after:absolute after:inset-0 after:opacity-90 after:bg-sky-700/40 after:blur-xl
              `;

              const innerGlowClasses = `
                absolute opacity-0 bg-sky-500/5 blur-xl rounded-[999px]
                group-hover:opacity-100 transition-opacity duration-300
              `;

              const getHoverClasses = (hasLine: boolean) => 
                !hasLine ? 'hover:before:opacity-100 hover:after:opacity-100 cursor-crosshair' : '';

              return ['top', 'bottom'].map((position) => (
                <AnimatePresence key={position}>
                  {(() => {
                    const shouldShowZone = () => {
                      if (!activeComparison) return !hasLine(position as 'top' | 'bottom');
                      if (stack.id === activeComparison.startStack) return false;
                      return position === activeComparison.startPosition && !hasLine(position as 'top' | 'bottom');
                    };

                    if (!shouldShowZone()) return null;

                    return (
                      <motion.div
                        key={`${position}-zone`}
                        className={`${baseZoneClasses} ${getHoverClasses(hasLine(position as 'top' | 'bottom'))} group interaction-zone`}
                        style={{
                          top: `${zonePositions[position as 'top' | 'bottom']}px`,
                          transform: 'translateY(-50%)',
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                        onClick={(e) => {
                          if (hasLine(position as 'top' | 'bottom')) return;
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          onConnectionPoint?.(
                            position as 'top' | 'bottom', 
                            rect.top + rect.height/2
                          );
                        }}
                      >
                        <div className={innerGlowClasses} />
                      </motion.div>
                    );
                  })()}
                </AnimatePresence>
              ))
            })()}
          </>
        )}
      </div>

      <div className="text-center mt-2 mb-10">
        <span className="text-6xl font-bold text-sky-400">
          {stack.blocks.length}
        </span>
      </div>
    </div>
  );
}