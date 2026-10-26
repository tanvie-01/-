import { useLayoutEffect, useState } from 'react'

/**
 * Largest uniform scale that fits a `targetW × targetH` box inside
 * `containerRef` (minus `pad` px on every side). Used by the editor stage
 * and the template thumbnails.
 */
export default function useFitScale(containerRef, targetW, targetH, pad = 0) {
  const [scale, setScale] = useState(0)

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => {
      const w = el.clientWidth - pad * 2
      const h = el.clientHeight - pad * 2
      const next = Math.min(w / targetW, h / targetH)
      setScale(Number.isFinite(next) && next > 0 ? next : 0)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [containerRef, targetW, targetH, pad])

  return scale
}
