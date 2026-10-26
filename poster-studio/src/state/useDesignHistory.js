import { useCallback, useReducer } from 'react'

const LIMIT = 60
const COALESCE_MS = 1200

// Undo/redo over whole design snapshots. Rapid updates that share a `key`
// (one drag gesture, typing into one field) collapse into a single undo step.
function reducer(state, action) {
  switch (action.type) {
    case 'update': {
      const next = action.fn(state.design)
      if (next === state.design) return state
      const now = Date.now()
      const coalesce = action.key && action.key === state.lastKey && now - state.lastTime < COALESCE_MS
      return {
        design: next,
        past: coalesce ? state.past : [...state.past.slice(-(LIMIT - 1)), state.design],
        future: [],
        lastKey: action.key || null,
        lastTime: now,
      }
    }
    case 'undo': {
      if (!state.past.length) return state
      return { design: state.past[state.past.length - 1], past: state.past.slice(0, -1), future: [state.design, ...state.future], lastKey: null, lastTime: 0 }
    }
    case 'redo': {
      if (!state.future.length) return state
      return { design: state.future[0], past: [...state.past, state.design], future: state.future.slice(1), lastKey: null, lastTime: 0 }
    }
    case 'load':
      return { design: action.design, past: action.keepHistory ? [...state.past, state.design] : [], future: [], lastKey: null, lastTime: 0 }
    default:
      return state
  }
}

export default function useDesignHistory(initial) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({ design: initial(), past: [], future: [], lastKey: null, lastTime: 0 }))
  const update = useCallback((fn, key) => dispatch({ type: 'update', fn, key }), [])
  const undo = useCallback(() => dispatch({ type: 'undo' }), [])
  const redo = useCallback(() => dispatch({ type: 'redo' }), [])
  const load = useCallback((design, keepHistory = false) => dispatch({ type: 'load', design, keepHistory }), [])
  return { design: state.design, update, undo, redo, load, canUndo: state.past.length > 0, canRedo: state.future.length > 0 }
}
