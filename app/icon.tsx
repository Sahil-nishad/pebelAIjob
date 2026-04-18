import { ImageResponse } from 'next/og'

export const size = { width: 64, height: 64 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 64,
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
        }}
      >
        <svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
          {/* Bottom stone: dark green */}
          <ellipse cx="32" cy="52" rx="27" ry="9" fill="#155233" />
          <ellipse cx="32" cy="49" rx="27" ry="10" fill="#1e7045" />
          <ellipse cx="32" cy="47" rx="24" ry="7" fill="#2a7d53" />

          {/* Middle stone: light gray */}
          <ellipse cx="32" cy="33" rx="19" ry="7" fill="#a8b0ac" />
          <ellipse cx="32" cy="31" rx="19" ry="7.5" fill="#c8d0cc" />
          <ellipse cx="32" cy="29" rx="17" ry="5" fill="#d4d9d6" />

          {/* Top stone: dark gray */}
          <ellipse cx="32" cy="17" rx="12" ry="5" fill="#4a5450" />
          <ellipse cx="32" cy="15.5" rx="12" ry="5.5" fill="#637069" />
          <ellipse cx="32" cy="14" rx="10" ry="3.5" fill="#7a8580" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
