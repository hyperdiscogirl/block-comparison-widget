import { motion, useMotionValue, AnimatePresence, PanInfo } from 'framer-motion'
import { useEffect } from 'react'
import { Block as BlockComponent } from '../Block'
import type { BlockStack as BlockStackType } from '../BlockComparisonWidget/types'

interface BlockStackProps {
  stack: BlockStackType;
  onStackClick?: () => void;
  onStackUpdate?: (removeIndex: number) => void;
  mode: 'addRemove' | 'drawCompare';
  blockSize: 'sm' | 'lg';
  floatMode: 'synced' | 'staggered' | 'off';
  shimmerEnabled: boolean;
}

export function BlockStack({ stack, onStackClick, onStackUpdate, mode, blockSize, floatMode, shimmerEnabled }: BlockStackProps) {
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

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo, index: number) => {
    const distanceMoved = Math.sqrt(info.offset.x ** 2 + info.offset.y ** 2);
    const deleteThreshold = 100;

    if (index === 0 && distanceMoved > deleteThreshold) {
      onStackUpdate?.(index);
    }
  };

  return (
    <div 
      className="w-32 h-full flex flex-col justify-between"
      onDoubleClick={onStackClick}
    >
      <div className="relative flex-grow flex flex-col items-center justify-center">
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
      </div>

      <div className="text-center mt-2 mb-10">
        <span className="text-6xl font-bold text-blue-400">
          {stack.blocks.length}
        </span>
      </div>
    </div>
  )
}