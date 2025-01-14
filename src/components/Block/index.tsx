import { useMemo, forwardRef, useState } from 'react';
import { motion } from 'framer-motion';

interface BlockProps {
  index: number;
  totalBlocks: number;
  screenWidth?: number;
  screenHeight?: number;
  draggable?: boolean;
  onDragEnd?: (event: any, info: any) => void;
  dragThreshold?: number;
}

export const Block = forwardRef<HTMLDivElement, BlockProps>(({
  index,
  totalBlocks,
  screenWidth = window.innerWidth,
  screenHeight = window.innerHeight,
  draggable = false,
  onDragEnd,
  dragThreshold = 100
}, ref) => {
  // calculate base size based on screen dimensions
  const size = useMemo(() => {
    const smallerDimension = Math.min(screenWidth, screenHeight);
    return Math.floor(smallerDimension * 0.07); 
  }, [screenWidth, screenHeight]);

  // ok no fuck this but i might make it configurable later
  // // adjust size based on number of blocks
  // const size = useMemo(() => {
  //   if (maxBlocks <= 5) {
  //     return Math.floor(baseSize * 2);
  //   }
  //   return baseSize;
  // }, [baseSize, maxBlocks]);

  const faceSize = Math.floor(size * 0.8);

  // container offset to center the cube
  // tbh not sure where this came from lol 
  const containerOffset = size * 0.5;

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
        marginBottom: `${size * (spacingMultiplier - 1)}px`
      }}
      exit={{ opacity: 0, scale: 0.8, zIndex: totalBlocks - index - 1}}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
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
          width: `${size}px`, 
          height: `${size}px`,
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