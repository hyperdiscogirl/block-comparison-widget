import { useMemo, forwardRef, useState, useEffect } from 'react';
import { motion, MotionValue, useTransform, useMotionValue } from 'framer-motion';

interface BlockProps {
  index: number;
  totalBlocks: number;
  screenWidth?: number;
  screenHeight?: number;
  draggable?: boolean;
  onDragEnd?: (event: any, info: any) => void;
  dragThreshold?: number;
  size?: 'sm' | 'lg';
  mode: 'addRemove' | 'drawCompare';
  floatProgress: MotionValue<number>;
  floatMode: 'synced' | 'staggered' | 'off';
  shimmerEnabled: boolean;
}

export const Block = forwardRef<HTMLDivElement, BlockProps>(({
  index,
  totalBlocks,
  draggable = false,
  onDragEnd,
  dragThreshold = 100,
  size = 'lg',
  mode,
  floatProgress,
  floatMode,
  shimmerEnabled
}, ref) => {
  const [shouldShimmer, setShouldShimmer] = useState(false);
  const [willDelete, setWillDelete] = useState(false);

  // shimmer effect on mode/size changes
  useEffect(() => {
    if (!shimmerEnabled) return;
    setShouldShimmer(true);
    const timer = setTimeout(() => setShouldShimmer(false), 500);
    return () => clearTimeout(timer);
  }, [mode, size, shimmerEnabled]);

  // staggered animation effect
  const offsetProgress = useMotionValue(0)
  
  useEffect(() => {
    if (floatMode === 'off') return;

    const unsubscribe = floatProgress.on('change', (latest) => {
      const offset = floatMode === 'staggered'
        ? (latest + (index * 0.2)) % 1  // staggered effect
        : latest                         // synced effect
      offsetProgress.set(offset)
    })
    return unsubscribe
  }, [floatProgress, index, floatMode])

  // scale the float distance based on both size and mode
  const floatDistance = useMemo(() => {
    const baseDistance = size === 'sm' ? -2 : -4;
    return floatMode === 'staggered' 
      ? baseDistance * 0.6  
      : baseDistance;        
  }, [size, floatMode]);

  const dragY = useMotionValue(0)
  const floatY = useTransform(
    offsetProgress, 
    [0, 0.5, 1], 
    floatMode === 'off' ? [0, 0, 0] : [0, floatDistance, 0]
  )

  // block sizing 
  const blockSize = useMemo(() => {
    return size === 'sm' ? 40 : 60;
  }, [size]);

  const faceSize = Math.floor(blockSize * 0.8);
  const containerOffset = blockSize * 0.5;
  const spacingMultiplier = 1.1;

  // isometric transforms
  const topTransform = `rotate(210deg) skew(-30deg) translate(${faceSize * 0.42}px, ${faceSize * 0.26}px) scaleY(0.864)`;
  const frontTransform = `rotate(-30deg) skewX(-30deg) translate(${faceSize * 0.375}px, ${faceSize * 0.5}px) scaleY(0.864)`;
  const sideTransform = `rotate(90deg) skewX(-30deg) scaleY(0.864) translate(${faceSize * 0.7}px, ${faceSize * 0.625}px)`;

  return (
    <motion.div
      ref={ref}
      className="flex items-center justify-center"
      style={{
        zIndex: totalBlocks - index,
        marginBottom: `${blockSize * (spacingMultiplier - 1)}px`,
        y: dragY,
        translateY: floatY
      }}
      exit={{ opacity: 0, scale: 0.8, zIndex: totalBlocks - index - 1}}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        filter: shouldShimmer 
          ? ["brightness(1)", "brightness(1.5)", "brightness(1)"] 
          : "brightness(1)"
      }}
      transition={{
        filter: {
          duration: 0.4,
          delay: index * 0.05,
          ease: "easeInOut"
        }
      }}
      drag={draggable}
      dragSnapToOrigin={!willDelete}
      onDragStart={() => setWillDelete(false)}
      onDrag={(_, info) => {
        setWillDelete(
          Math.abs(info.offset.x) > dragThreshold || 
          Math.abs(info.offset.y) > dragThreshold
        );
      }}
      onDragEnd={(event, info) => {
        if (willDelete) {
          onDragEnd?.(event, info);
        }
      }}
    >
      <div 
        className="relative"
        style={{ 
          width: `${blockSize}px`, 
          height: `${blockSize}px`,
          transform: `translateX(${containerOffset * 0.4}px)`
        }}
      >
        <div 
          className="absolute bg-blue-500"
          style={{
            width: `${faceSize}px`,
            height: `${faceSize}px`,
            transform: topTransform
          }}
        />
        <div 
          className="absolute bg-blue-800"
          style={{
            width: `${faceSize}px`,
            height: `${faceSize}px`,
            transform: frontTransform
          }}
        />
        <div 
          className="absolute bg-blue-300"
          style={{
            width: `${faceSize}px`,
            height: `${faceSize}px`,
            transform: sideTransform
          }}
        />
      </div>
    </motion.div>
  );
});

export default Block;