import React from 'react'
import { photoLayout } from '../lib/photo.js'

/**
 * Draws `photo` inside a w × h frame using the crop model in lib/photo.js.
 * The image is sized from its real aspect ratio (never stretched) and its
 * offset is bounded by the available slack, so in "cover" mode the frame is
 * always completely filled. In "contain" mode the whole photo is shown over a
 * soft blurred copy of itself instead of empty bars.
 */
export default function PhotoFill({ photo, w, h, filter, placeholder = 'light' }) {
  const L = photo?.src ? photoLayout(photo, w, h) : null
  if (!L) return <Placeholder tone={placeholder} />

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#1d1f26' }}>
      {photo.fit === 'contain' && (
        <img
          src={photo.src}
          alt=""
          draggable={false}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'blur(22px) brightness(0.85) saturate(1.1)',
            transform: `scale(1.2) rotate(${photo.rotate || 0}deg)`,
            opacity: 0.9,
          }}
        />
      )}
      <img
        src={photo.src}
        alt=""
        draggable={false}
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: L.imgW,
          height: L.imgH,
          maxWidth: 'none',
          transform: `translate(-50%, -50%) translate(${L.offX}px, ${L.offY}px) rotate(${photo.rotate || 0}deg)`,
          filter: filter || undefined,
          userSelect: 'none',
        }}
      />
    </div>
  )
}

function Placeholder({ tone }) {
  const dark = tone === 'dark'
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
      <rect width="100" height="100" fill={dark ? '#3a3f4b' : '#d9dde5'} />
      <circle cx="50" cy="40" r="17" fill={dark ? '#5b6170' : '#b3bac6'} />
      <path d="M14 100 C14 70 86 70 86 100 Z" fill={dark ? '#5b6170' : '#b3bac6'} />
    </svg>
  )
}
