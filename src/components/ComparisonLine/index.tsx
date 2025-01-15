import { motion } from 'framer-motion';
import { getStackBlockPositions } from '../../utils/stackPositioning';

export interface ComparisonLine {
  id: string;
  startStack: number;
  endStack: number;
  position: 'top' | 'bottom';
  type: 'auto' | 'student';
}

interface ComparisonLayerProps {
  comparisonLines: ComparisonLine[];
  activeComparison: {
    startStack: number;
    startPosition: 'top' | 'bottom';
    startY: number;
  } | null;
  mousePosition: { x: number; y: number } | null;
  containerRef: React.RefObject<HTMLDivElement>;
}

export function ComparisonLayer({ 
    comparisonLines, 
    activeComparison, 
    mousePosition,
    containerRef 
  }: ComparisonLayerProps) {
    const OFFSET = 12;
    
    
    const createPath = (startX: number, startY: number, endX: number, endY: number) => {
      //  M command moves to the start point without drawing
      //  L command draws a line to the end point
      return `M ${startX} ${startY} L ${endX} ${endY}`;
    };

    const getStackPosition = (stackIndex: number, position: 'top' | 'bottom') => {
      if (!containerRef.current) return { x: 0, y: 0 };
      
      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const x = (containerWidth / 3) * (stackIndex + 1);
      
      const stackElement = container.querySelectorAll('.relative.flex-grow')[stackIndex];
      const positions = getStackBlockPositions(stackElement, OFFSET);
      const containerRect = container.getBoundingClientRect();
      
      const y = position === 'top' 
        ? positions.top - containerRect.top 
        : positions.bottom - containerRect.top;
      
      return { x, y };
    };

    return (
      <svg 
        className="absolute inset-0 pointer-events-none z-40" 
        style={{ 
          overflow: 'visible',
          width: '100%',
          height: '100%'
        }}
      >
        {/* Completed comparison lines */}
        {comparisonLines.map(line => {
          const start = getStackPosition(line.startStack - 1, line.position);
          const end = getStackPosition(line.endStack - 1, line.position);
          
          return (
            <motion.path
              key={line.id}
              d={createPath(start.x, start.y, end.x, end.y)}
              stroke="white"
              strokeWidth={5}
              strokeLinecap="round" 
              style={{
                filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.7))',
              }}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5 }}
            />
          );
        })}

        {/* Active drawing line */}
        {activeComparison && mousePosition && containerRef.current && (
          <motion.path
            d={createPath(
              getStackPosition(activeComparison.startStack - 1, activeComparison.startPosition).x,
              activeComparison.startY - containerRef.current.getBoundingClientRect().top,
              mousePosition.x,
              mousePosition.y
            )}
            stroke="white"
            strokeWidth={5}
            strokeDasharray="4 4"
            style={{
              filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.7))',
            }}
            fill="none"
          />
        )}
      </svg>
    );
}