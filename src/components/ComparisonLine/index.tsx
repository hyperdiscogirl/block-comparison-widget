import { motion } from 'framer-motion';
import { getStackBlockPositions } from '../../utils/stackPositioning';
import { ComparisonSymbol } from '../ComparisonSymbol';
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
    startX: number;
  } | null;
  mousePosition: { x: number; y: number } | null;
  containerRef: React.RefObject<HTMLDivElement>;
  isAnimating?: boolean;
  stackSizes: { [key: number]: number };
  onAnimationComplete?: () => void;
  onLineAnimationComplete: (lineId: string) => void;
  animatingLines: Set<string>;
}

export function ComparisonLayer({ 
    comparisonLines, 
    activeComparison, 
    mousePosition,
    containerRef,
    isAnimating = false,
    stackSizes,
    onAnimationComplete,
    onLineAnimationComplete,
    animatingLines
  }: ComparisonLayerProps) {
    const OFFSET = 12;
    
    const createPath = (startX: number, startY: number, endX: number, endY: number) => {
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

    const showSymbol = comparisonLines.length === 2 && animatingLines.size === 0;

    return (
      <svg 
        className="absolute inset-0 pointer-events-none z-40" 
        style={{ 
          overflow: 'visible',
          width: '100%',
          height: '100%'
        }}
      >
        {/* Lines fade out when symbol appears */}
        {comparisonLines.map(line => {
          const start = getStackPosition(line.startStack - 1, line.position);
          const end = getStackPosition(line.endStack - 1, line.position);
          const isAnimating = animatingLines.has(line.id);
          
          return (
            <motion.path
              key={line.id}
              d={createPath(start.x, start.y, end.x, end.y)}
              stroke="white"
              strokeWidth={8}
              strokeLinecap="round"
              style={{
                filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.7))',
              }}
              initial={isAnimating ? { pathLength: 0, opacity: 1 } : { pathLength: 1, opacity: 1 }}
              animate={{ 
                pathLength: 1,
                opacity: showSymbol ? 0 : 1
              }}
              transition={{ 
                pathLength: { duration: 0.5, ease: "easeInOut" },
                opacity: { duration: 0.3 }
              }}
              onAnimationComplete={() => {
                if (isAnimating) {
                  onLineAnimationComplete(line.id);
                }
              }}
            />
          );
        })}

        {/* Show symbol when lines are done */}
        {showSymbol && (
          <ComparisonSymbol
            type={(() => {
              const stack1Size = stackSizes[1];
              const stack2Size = stackSizes[2];
              if (stack1Size === stack2Size) return '=';
              return stack1Size < stack2Size ? '<' : '>';
            })()}
            position={{
              x: (getStackPosition(0, 'top').x + getStackPosition(1, 'top').x) / 2,
              y: (getStackPosition(0, 'top').y + getStackPosition(1, 'bottom').y) / 2
            }}
            isAnimating={isAnimating}
            linePositions={{
              topStart: getStackPosition(0, 'top'),
              topEnd: getStackPosition(1, 'top'),
              bottomStart: getStackPosition(0, 'bottom'),
              bottomEnd: getStackPosition(1, 'bottom')
            }}
            persist={true}
            onAnimationComplete={onAnimationComplete}
          />
        )}

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
            strokeWidth={8}
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