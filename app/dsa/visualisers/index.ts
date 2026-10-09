import type { ComponentType } from 'react'
import type { Source } from '../code-panel'
import DynamicArrayVisualiser from './dynamic-array'

// Each topic's visualiser, and the functions in its C++ source the visualiser lights up as they run
export const VISUALISERS: Record<string, { Component: ComponentType<{ source: Source }>; functions: string[] }> = {
  'dynamic-array': {
    Component: DynamicArrayVisualiser,
    functions: ['push_back', 'pop_back', 'insert', 'erase', 'grow'],
  },
}
