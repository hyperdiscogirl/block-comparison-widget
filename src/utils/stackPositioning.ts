export function getStackBlockPositions(stackElement: Element | null, offset: number = 12) {
    if (!stackElement) return { top: 0, bottom: 0 };
    
    // Find all blocks in this stack
    const blocks = stackElement.querySelectorAll('.flex.items-center.justify-center');
    if (!blocks.length) return { top: 0, bottom: 0 };
  
    // Get the first and last block positions
    const firstBlock = blocks[0];
    const lastBlock = blocks[blocks.length - 1];
    const firstRect = firstBlock.getBoundingClientRect();
    const lastRect = lastBlock.getBoundingClientRect();
  
    // Return positions with offsets - notice we subtract from top and add to bottom
    // This creates space above the highest block and below the lowest block
    return {
      top: firstRect.top - offset,     // Move interaction zone up
      bottom: lastRect.bottom + offset  // Move interaction zone down
    };
  }

  export function getStackPosition(
    containerRef: React.RefObject<HTMLDivElement>, 
    stackIndex: number, 
    position: 'top' | 'bottom',
    offset: number = 12
) {
    if (!containerRef.current) return { x: 0, y: 0 };
    
    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const x = (containerWidth / 3) * (stackIndex + 1);
    
    const stackElement = container.querySelectorAll('.relative.flex-grow')[stackIndex];
    const positions = getStackBlockPositions(stackElement, offset);
    const containerRect = container.getBoundingClientRect();
    
    const y = position === 'top' 
      ? positions.top - containerRect.top 
      : positions.bottom - containerRect.top;
    
    return { x, y };
}