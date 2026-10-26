import React, { useLayoutEffect, useRef, useState } from 'react'
import useFontsVersion from '../lib/useFontsVersion.js'

/**
 * Text that always fits its box: renders at `size` px and, if the content
 * would overflow `w × h` (too long a name, a multi-line message…), shrinks
 * the font until it fits. This is what keeps template layouts intact when
 * the content changes — nothing ever pushes neighbouring blocks around.
 */
export default function FitText({ text, w, h, size, minSize, wrap = true, align = 'center', valign = 'center', style }) {
  const ref = useRef(null)
  const fontsVersion = useFontsVersion()
  const [fontSize, setFontSize] = useState(size)
  const styleKey = `${style?.fontFamily}|${style?.fontWeight}|${style?.letterSpacing}|${style?.lineHeight}|${style?.fontStyle}|${style?.textTransform}`

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const min = minSize || Math.max(8, Math.round(size * 0.28))
    const fits = (s) => {
      el.style.fontSize = `${s}px`
      return el.scrollHeight <= h + 0.5 && el.scrollWidth <= w + 0.5
    }
    let best = size
    if (!fits(size)) {
      let lo = min
      let hi = size
      best = min
      for (let i = 0; i < 12; i++) {
        const mid = (lo + hi) / 2
        if (fits(mid)) {
          best = mid
          lo = mid
        } else hi = mid
      }
    }
    best = Math.floor(best * 10) / 10
    el.style.fontSize = `${best}px`
    setFontSize(best)
  }, [text, w, h, size, minSize, wrap, fontsVersion, styleKey])

  return (
    <div
      style={{
        width: w,
        height: h,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: valign === 'top' ? 'flex-start' : valign === 'bottom' ? 'flex-end' : 'center',
      }}
    >
      <div
        ref={ref}
        style={{
          width: '100%',
          textAlign: align,
          whiteSpace: wrap ? 'pre-line' : 'pre',
          overflowWrap: 'break-word',
          ...style,
          fontSize,
        }}
      >
        {text}
      </div>
    </div>
  )
}
