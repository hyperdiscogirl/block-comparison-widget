export function getStackBlockPositions(stackElement: Element | null, offset: number = 12) {
  if (!stackElement) return { top: 0, bottom: 0 };
  
  const allBlocks = stackElement.querySelectorAll('.flex.items-center.justify-center');
  const blocks = Array.from(allBlocks).filter(block => {
      const style = window.getComputedStyle(block);
      // filter out blocks that might still be in the dom from swiping
      const rect = block.getBoundingClientRect();
      return style.opacity !== '0' && 
             rect.width > 0 && 
             rect.height > 0 && 
             Math.abs(rect.y) < 10000; 
  });

  if (!blocks.length) return { top: 0, bottom: 0 };

  const firstBlock = blocks[0];
  const lastBlock = blocks[blocks.length - 1];
  const firstRect = firstBlock.getBoundingClientRect();
  const lastRect = lastBlock.getBoundingClientRect();

  return {
      top: firstRect.top - offset,
      bottom: lastRect.bottom + offset
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
  
  const stackElements = container.querySelectorAll('.relative.flex-grow');
  if (stackIndex >= stackElements.length) return { x, y: 0 };
  
  const stackElement = stackElements[stackIndex];
  const positions = getStackBlockPositions(stackElement, offset);
  const containerRect = container.getBoundingClientRect();
  
  const y = position === 'top' 
      ? Math.min(positions.top - containerRect.top, containerRect.height)
      : Math.min(positions.bottom - containerRect.top, containerRect.height);
  
  return { x, y };
}