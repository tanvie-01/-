import { useEffect, useState } from 'react'

let version = 0
const listeners = new Set()

if (typeof document !== 'undefined' && document.fonts) {
  const bump = () => {
    version += 1
    listeners.forEach((fn) => fn(version))
  }
  document.fonts.addEventListener?.('loadingdone', bump)
  document.fonts.ready.then(bump)
}

/**
 * Returns a counter that increases whenever web fonts finish loading, so
 * text that auto-fits its box can re-measure with the real font metrics.
 */
export default function useFontsVersion() {
  const [v, setV] = useState(version)
  useEffect(() => {
    listeners.add(setV)
    return () => listeners.delete(setV)
  }, [])
  return v
}
