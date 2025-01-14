import { AnimatePresence, PanInfo } from 'framer-motion'
import { Block as BlockComponent } from '../Block'
import type { BlockStack as BlockStackType } from '../BlockComparisonWidget/types'

interface BlockStackProps {
  stack: BlockStackType;
  onStackClick?: () => void;
  onStackUpdate?: (removeIndex: number) => void;
}

export function BlockStack({ stack, onStackClick, onStackUpdate }: BlockStackProps) {
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
              totalBlocks={stack.blocks.length}
              index={index} 
              draggable={index === 0 && stack.blocks.length > 1}
              onDragEnd={(event, info) => handleDragEnd(event, info, index)}
            />
          ))}
        </AnimatePresence>
      </div>

      <div className="text-center mt-2">
        <span className="text-4xl font-bold text-blue-400">
          {stack.blocks.length}
        </span>
      </div>
    </div>
  )
}