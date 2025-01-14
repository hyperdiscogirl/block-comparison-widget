export type InteractionMode = 'addRemove' | 'drawCompare';

export interface BlockStack {
  id: number;
  blocks: number;
  value: number;
  mode: 'input' | 'label';
}

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