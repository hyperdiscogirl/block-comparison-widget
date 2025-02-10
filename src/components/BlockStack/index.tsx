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
  // ok i have a lot of refs here !
  // they have kind of distinct use cases, but might be worth verifying these are all necessary 
  // REFRESH: a ref is a direct reference to a DOM element or value (like document.getElementById in html)
  // it persists across re-renders, so it kind of bypasses react's usual state management flow (declarative - describing what you want vs imperative - directly manipulating what is)
  // maintaining a stable pointer to something that might change]

  // dom reference - tracks the container div - not something react manages well
  const blocksContainerRef = useRef<HTMLDivElement>(null);
  // prevents concurrent updates wo triggering more updates
  const isUpdatingRef = useRef(false);
  // tracks the id of a block being removed, to render not draggable while animating out
  const exitingBlockRef = useRef<string | null>(null);
  // tracks the prev number of blocks in the stack
  const previousBlockCountRef = useRef(stack.blocks.length);


  // offset for the interaction zones
  const INTERACTION_ZONE_OFFSET = 12;
  // state for the positions of the interaction zones
  const [zonePositions, setZonePositions] = useState({ top: 0, bottom: 0 });
  // state for whether a block is in the process of animating out
  const [isExiting, setIsExiting] = useState(false);
  // framer motion hook creates value that can animate smooothly w/o causing re-renders
  // passed down to block component to synchronize float animation
  const floatProgress = useMotionValue(0);

  // checks if there is an existing line at a given position
  const hasLine = (position: 'top' | 'bottom') => {
    return hasExistingLine(stack.id, position);
  };

  // updates the positions of the blocks in the stack so we can update the interaction zones positions
  // after layout changes
  const updatePositions = useCallback(() => {
    // prevents concurrent updates
    if (isUpdatingRef.current) return;
    
    isUpdatingRef.current = true;

    const updateOnce = () => {
      if (!blocksContainerRef.current) return;

      try {
        const positions = getStackBlockPositions(blocksContainerRef.current, INTERACTION_ZONE_OFFSET);
        // dom api method returning domrect opject with info abt the element's dimensions 
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

    //  rAF - browser API that schedules a callback to run before next browsser repaint 
    // synch updates with browsr's render cycle
    // double update with delay ensures that final positions are correct 
    // tbh, i am not sure this is necesssary or optimal, but i recall having issues with the positions not updating aggressively enough 
    requestAnimationFrame(() => {
      updateOnce();
      setTimeout(() => {
        updateOnce();
        isUpdatingRef.current = false;
      }, 50);
    });
  }, [stack.id, stack.blocks.length, INTERACTION_ZONE_OFFSET]);


  // handles the event when a block is dragged and released
  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo, index: number) => {
    const distanceMoved = Math.sqrt(info.offset.x ** 2 + info.offset.y ** 2);
    const deleteThreshold = 100;

    if (index === 0 && distanceMoved > deleteThreshold) {
      setIsExiting(true);
      exitingBlockRef.current = stack.blocks[0].id;
      
      // the purpose of this (isExiting and timeout) was to make it so the block isnt draggable 
      // while animating out  - but rn not actually sure the timeout is needed
      setTimeout(() => {
        onStackUpdate?.(index);
        setIsExiting(false);
        exitingBlockRef.current = null;
        updatePositions();
      }, 200);
    }
  };

  // trigger on stackclick to remove comparison if not in interaction zone 
  const handleContainerClick = (e: React.MouseEvent) => {
    if (mode === 'drawCompare') {
      const isInteractionZone = (e.target as HTMLElement).classList.contains('interaction-zone');
      if (!isInteractionZone) {
        onStackClick?.();
      }
    }
  };

  // float animation timing - passed down to block component to synchronize float animation
  useEffect(() => {
    if (floatMode === 'off') return;

    //hmm, i think i used this because it's a pattern ive seen before
    // but maybe i should check framer motion functionalities for this, for consistency 
    const animate = () => {
      // calculation enables a smooth loop over 2s
      const time = (Date.now() / 2000) % 1;
      floatProgress.set(time);
      // schedule next frame
      requestAnimationFrame(animate);
    };

    // start the animation loop
    const animation = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animation);
  }, [floatMode]);

  // watch for block count changes 
  useEffect(() => {
    const blockCountChanged = previousBlockCountRef.current !== stack.blocks.length;
    previousBlockCountRef.current = stack.blocks.length;

    if (blockCountChanged) {
      updatePositions();
    }
  }, [stack.blocks.length, stack.id, updatePositions]);

  // watch for setting/mode changes 
  useEffect(() => {
    updatePositions();
  }, [blockSize, floatMode, mode, updatePositions]);

  // watch for DOM changes (maybe i could have combined these all into one useEffect)
  useEffect(() => {
    if (!blocksContainerRef.current) return;

    let pendingUpdateTimeout: number;

    // listens for dom changes, mb more efficient than polling 
    const observer = new MutationObserver((mutations) => {
      if (isUpdatingRef.current) return;

      const hasRelevantChanges = mutations.some(mutation => 
        mutation.type === 'childList' || 
        (mutation.type === 'attributes' && 
         (mutation.attributeName === 'style' || mutation.attributeName === 'class'))
      );

      // debounce to prevent too many updates from rapid changes
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
        {/* 
        framer motion component that allows animations for elemnst that are mounting/unmounting
        popLayout - prevent layout shift when animating out
        initial={false} - dont animate the first render
        */}
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
              // lol, i should have def pulled this out of the render loop
              //especially since they are NESTED iifes
              // define shared styles for top & bottom zones 
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