import { motion } from 'framer-motion';
import { useState } from 'react';
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
    persist?: boolean;
    onAnimationComplete?: () => void;
  }
  
  export function ComparisonSymbol({ type, position, isAnimating, linePositions, persist = false, onAnimationComplete }: ComparisonSymbolProps) {
    const [hasAnimated, setHasAnimated] = useState(false);
    const [isGlowing, setIsGlowing] = useState(false);
  
    const getSymbolPath = () => {
      const size = 40;
      const x = position.x;
      const y = position.y;
      
      if (type === '=') {
        return `
          M ${x-size/2} ${y-size/3}
          L ${x+size/2} ${y-size/3}
          M ${x-size/2} ${y+size/3}
          L ${x+size/2} ${y+size/3}
        `;
      }
      
      const leftX = type === '>' ? x-size/2 : x+size/2;
      const rightX = type === '>' ? x+size/2 : x-size/2;
      
      return `
        M ${leftX} ${y-size/2}
        L ${rightX} ${y}
        M ${leftX} ${y+size/2}
        L ${rightX} ${y}
      `;
    };
  
    const getLinePaths = () => {
      if (type === '=') {
        return `
          M ${linePositions.topStart.x} ${linePositions.topStart.y}
          L ${linePositions.topEnd.x} ${linePositions.topEnd.y}
          M ${linePositions.bottomStart.x} ${linePositions.bottomStart.y}
          L ${linePositions.bottomEnd.x} ${linePositions.bottomEnd.y}
        `;
      }
  
      // For '<', swap start and end points to match the final symbol structure
      const start = type === '>' ? linePositions.topStart : linePositions.topEnd;
      const end = type === '>' ? linePositions.topEnd : linePositions.topStart;
      const bottomStart = type === '>' ? linePositions.bottomStart : linePositions.bottomEnd;
      const bottomEnd = type === '>' ? linePositions.bottomEnd : linePositions.bottomStart;
  
      return `
        M ${start.x} ${start.y}
        L ${end.x} ${end.y}
        M ${bottomStart.x} ${bottomStart.y}
        L ${bottomEnd.x} ${bottomEnd.y}
      `;
    };
  
    const shouldShowSymbol = isAnimating || (persist && hasAnimated);
  
    return (
      <>
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="5" result="blur"/>
            <feFlood floodColor="white" floodOpacity="0.5" result="glow"/>
            <feComposite in="glow" in2="blur" operator="in" result="softGlow"/>
            <feMerge>
              <feMergeNode in="softGlow"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <motion.path
          initial={{ d: getLinePaths() }}
          animate={{ 
            d: shouldShowSymbol ? getSymbolPath() : getLinePaths(),
            filter: shouldShowSymbol ? 'none' : 'url(#glow)',
          }}
          transition={{ 
            duration: 1,
            ease: [0.4, 0, 0.2, 1],
            type: "tween"
          }}
          onAnimationComplete={() => {
            if (isAnimating) {
              setHasAnimated(true);
              setIsGlowing(true);
              onAnimationComplete?.();
            }
          }}
          stroke="white"
          strokeWidth={8}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {isGlowing && (
          <motion.path
            d={getSymbolPath()}
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0, 0.15, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            stroke="white"
            strokeWidth={8}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              filter: 'none',
              pointerEvents: 'none'
            }}
          />
        )}
      </>
    );
  }