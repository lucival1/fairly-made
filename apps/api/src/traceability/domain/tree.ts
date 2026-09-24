import type { DeclaredTree, Item, Step } from './types.js';

/** Every item of a tree, root first (depth-first). */
export function allItems(tree: DeclaredTree): Item[] {
  const walk = (item: Item): Item[] => [
    item,
    ...item.children.flatMap((child: Item) => walk(child)),
  ];
  return walk(tree.rootItem);
}

export function findItem(tree: DeclaredTree, itemId: string): Item | undefined {
  return allItems(tree).find((item) => item.id === itemId);
}

export function findStep(tree: DeclaredTree, stepId: string): Step | undefined {
  return allItems(tree)
    .flatMap((item) => item.steps)
    .find((step) => step.id === stepId);
}
