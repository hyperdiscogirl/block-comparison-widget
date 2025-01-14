export type InteractionMode = 'addRemove' | 'drawCompare';

export interface Point {
  x: number;
  y: number;
}

export interface ComparisonLine {
  id: number;
  startStack: number;
  endStack: number;
  position: 'top' | 'bottom';
}

export interface Block {
    id: string;
    position: number;
  }
  
export interface BlockStack {
id: number;
blocks: Block[]; 
value: number;
mode: 'input' | 'label';
}
  
