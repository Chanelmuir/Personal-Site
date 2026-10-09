// The stops on the DSA map, in learning order. A stop with a slug has a page (content/dsa/<slug>.md);
// the rest are still to come. Data structures come first, then the algorithms built on them.
export interface Stop {
  name: string
  note: string
  slug?: string
}

export const LINES: { name: string; colour: string; stops: Stop[] }[] = [
  {
    name: 'Data structures',
    colour: 'var(--color-accent)',
    stops: [
      { name: 'Dynamic array', note: 'Doubling when it fills up', slug: 'dynamic-array' },
      { name: 'Linked list', note: 'Nodes that point to the next one' },
      { name: 'Stack and queue', note: 'Last in first out, first in first out' },
      { name: 'Hash map', note: 'Hashing keys into buckets' },
      { name: 'Binary search tree', note: 'Smaller left, bigger right' },
      { name: 'Heap', note: 'Always know the smallest' },
      { name: 'Graph', note: 'Nodes and the edges between them' },
    ],
  },
  {
    name: 'Algorithms',
    colour: 'var(--color-text-primary)',
    stops: [
      { name: 'Binary search', note: 'Halving a sorted array' },
      { name: 'Sorting', note: 'Insertion, merge and quick sort' },
      { name: 'BFS and DFS', note: 'Walking a graph' },
      { name: 'Dijkstra and A*', note: 'Shortest paths on real streets' },
      { name: 'Dynamic programming', note: 'Remembering answers to subproblems' },
    ],
  },
]
