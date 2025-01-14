import { AnimatePresence, PanInfo } from 'framer-motion'
import { Block } from '../Block'
import type { BlockStack as BlockStackType } from '../BlockComparisonWidget/types'

interface BlockStackProps {
  stack: BlockStackType;
  maxBlocks: number;
  onStackClick?: () => void;
  onStackUpdate?: (newBlockCount: number) => void;
}

export function BlockStack({ stack, maxBlocks, onStackClick, onStackUpdate }: BlockStackProps) {
  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo, index: number) => {
    const distanceMoved = Math.sqrt(info.offset.x ** 2 + info.offset.y ** 2);
    const deleteThreshold = 100;

    console.log('Drag ended:', {
      index,
      distanceMoved,
      deleteThreshold,
      isTopBlock: index === 0,
      stackBlocks: stack.blocks
    });

    if (index === 0 && distanceMoved > deleteThreshold) {
      console.log('Removing block');
      onStackUpdate?.(stack.blocks - 1);
      console.log('Stack blocks after update:', stack.blocks);
    }
  };

  return (
    <div 
      className="w-32 h-full flex flex-col justify-between"
      onClick={onStackClick}
    >
      {/* block container */}
      <div className="relative flex-grow flex flex-col items-center justify-center">
        <AnimatePresence>
          {Array.from({ length: stack.blocks }).map((_, index) => (
            <Block 
              key={`block-${stack.blocks}-${index}`}
              totalBlocks={stack.blocks}
              maxBlocks={maxBlocks}
              index={index} 
              draggable={index === 0 && stack.blocks > 1}
              onDragEnd={(event, info) => handleDragEnd(event, info, index)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* label */}
      <div className="text-center mt-2">
        <span className="text-4xl font-bold text-blue-400">
          {stack.blocks}
        </span>
      </div>
    </div>
  )
}