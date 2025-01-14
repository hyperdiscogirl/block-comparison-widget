import { useMemo, forwardRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

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
}

export const Block = forwardRef<HTMLDivElement, BlockProps>(({
  index,
  totalBlocks,
  draggable = false,
  onDragEnd,
  dragThreshold = 100,
  size = 'lg',
  mode
}, ref) => {
  const [shouldShimmer, setShouldShimmer] = useState(false);

  // trigger shimmer animation when mode or size changes
  // this needs some work doesnt quite do what i want - only trigeers on new cube creation 
  useEffect(() => {
    setShouldShimmer(true);
    const timer = setTimeout(() => setShouldShimmer(false), 500);
    return () => clearTimeout(timer);
  }, [mode, size]);

  // fixed sizes instead of calculations
  const blockSize = useMemo(() => {
    return size === 'sm' ? 40 : 60;
  }, [size]);

  const faceSize = Math.floor(blockSize * 0.8);

  // container offset to center the cube
  const containerOffset = blockSize * 0.5;

  const topTransform = `rotate(210deg) skew(-30deg) translate(${faceSize * 0.42}px, ${faceSize * 0.26}px) scaleY(0.864)`;
  const frontTransform = `rotate(-30deg) skewX(-30deg) translate(${faceSize * 0.375}px, ${faceSize * 0.5}px) scaleY(0.864)`;
  const sideTransform = `rotate(90deg) skewX(-30deg) scaleY(0.864) translate(${faceSize * 0.7}px, ${faceSize * 0.625}px)`;

  // increasing adds more space between blocks
  const spacingMultiplier = 1.1; 

  const [willDelete, setWillDelete] = useState(false);

  return (
    <motion.div
      ref={ref}
      className="flex items-center justify-center"
      style={{
        zIndex: totalBlocks - index,
        marginBottom: `${blockSize * (spacingMultiplier - 1)}px`
      }}
      exit={{ opacity: 0, scale: 0.8, zIndex: totalBlocks - index - 1}}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        y: [0, -4, 0], // subtle float up and down,
        filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"]
      }}
      transition={{
        y: {
          duration: 2,
          repeat: Infinity,
        },
        filter: {
          duration: 0.5,
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
          transform: `translateX(${containerOffset * 0.4}px)` // adjust horizontal position
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