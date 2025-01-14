import { useMemo } from 'react';
import { motion, PanInfo } from 'framer-motion';

interface BlockProps {
  index: number;
  totalBlocks: number;
  maxBlocks: number;
  screenWidth?: number;
  screenHeight?: number;
  draggable?: boolean;
  onDragEnd?: (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void;
}

export function Block({ index, totalBlocks, maxBlocks, screenWidth = window.innerWidth, screenHeight = window.innerHeight, draggable = false, onDragEnd }: BlockProps) {
  // calculate base size based on screen dimensions
  // uh , i dont think this works right though 
  const baseSize = useMemo(() => {
    const smallerDimension = Math.min(screenWidth, screenHeight);
    return Math.floor(smallerDimension * 0.07); 
  }, [screenWidth, screenHeight]);

  // adjust size based on number of blocks
  const size = useMemo(() => {
    if (maxBlocks <= 5) {
      return Math.floor(baseSize * 2);
    }
    return baseSize;
  }, [baseSize, maxBlocks]);

  const faceSize = Math.floor(size * 0.8);

  // container offset to center the cube
  // brian - here & below 
  const containerOffset = size * 0.5;

  // face transforms
  const topTransform = `rotate(210deg) skew(-30deg) translate(${faceSize * 0.42}px, ${faceSize * 0.26}px) scaleY(0.864)`;
  const frontTransform = `rotate(-30deg) skewX(-30deg) translate(${faceSize * 0.375}px, ${faceSize * 0.5}px) scaleY(0.864)`;
  const sideTransform = `rotate(90deg) skewX(-30deg) scaleY(0.864) translate(${faceSize * 0.7}px, ${faceSize * 0.625}px)`;

  const spacingMultiplier = 1.1; // increase to add more space between blocks

  return (
    <motion.div
      className="flex items-center justify-center"
      style={{
        zIndex: totalBlocks - index,
        marginBottom: `${size * (spacingMultiplier - 1)}px`
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8, zIndex: totalBlocks - index - 1}}
      drag={draggable}
      onDragEnd={onDragEnd}
    >
      <div 
        className="relative"
        style={{ 
          width: `${size}px`, 
          height: `${size}px`,
          transform: `translateX(${containerOffset * 0.4}px)` // adjust horizontal position - brian
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
}

export default Block;