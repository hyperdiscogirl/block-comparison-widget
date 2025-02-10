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
  

// ruh oh, I'm not even using like any of these properties!! i def should have refactored this 
export interface BlockStack {
id: number;
blocks: Block[]; 
value: number;
mode: 'input' | 'label';
}
  
