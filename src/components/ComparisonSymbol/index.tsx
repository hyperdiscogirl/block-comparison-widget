import { motion } from 'framer-motion';

interface ComparisonSymbolProps {
    type: '>' | '<' | '=';
    position: { x: number; y: number };
    isAnimating: boolean;
    linePositions: {
      topStart: { x: number; y: number };
      topEnd: { x: number; y: number };
      bottomStart: { x: number; y: number };
      bottomEnd: { x: number; y: number };
    };
  }
  
  export function ComparisonSymbol({ type, position, isAnimating, linePositions }: ComparisonSymbolProps) {
    const getSymbolPath = (type: '>' | '<' | '=') => {
      const size = 40;
      const x = position.x;
      const y = position.y;
      
      switch(type) {
        case '>':
          return `M ${x-size/2} ${y-size/2} L ${x+size/2} ${y} L ${x-size/2} ${y+size/2}`;
        case '<':
          return `M ${x+size/2} ${y-size/2} L ${x-size/2} ${y} L ${x+size/2} ${y+size/2}`;
        case '=':
          return `M ${x-size/2} ${y-size/3} H ${x+size/2} M ${x-size/2} ${y+size/3} H ${x+size/2}`;
      }
    };
  
    const getInitialLinePaths = () => `
      M ${linePositions.topStart.x} ${linePositions.topStart.y} 
      L ${linePositions.topEnd.x} ${linePositions.topEnd.y}
      M ${linePositions.bottomStart.x} ${linePositions.bottomStart.y}
      L ${linePositions.bottomEnd.x} ${linePositions.bottomEnd.y}
    `;
  
    return (
      <motion.path
        initial={{ d: getInitialLinePaths() }}
        animate={{ 
          d: isAnimating ? getSymbolPath(type) : getInitialLinePaths(),
          pathLength: isAnimating ? 1 : undefined
        }}
        transition={{ 
          duration: 1,
          ease: "easeInOut"
        }}
        stroke="white"
        strokeWidth={5}
        fill="none"
        strokeLinecap="round"
      />
    );
  }