import { hashSeed, sketchSquarePath } from '../../../utils/sketchPath'

function avatarImgProps(url: string) {
  return /^https?:\/\//.test(url) ? { crossOrigin: 'anonymous' as const } : {}
}

function PlaceholderIcon({ size, side }: { size: number; side: 'left' | 'right' }) {
  return (
    <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 40 40" fill="none">
      {side === 'left' ? (
        <>
          <rect x="8" y="10" width="24" height="20" rx="2" stroke="#000" strokeWidth="2" fill="none" />
          <circle cx="16" cy="18" r="2" fill="#000" />
          <circle cx="24" cy="18" r="2" fill="#000" />
          <path d="M14 24 Q20 28 26 24" stroke="#000" strokeWidth="1.5" fill="none" />
          <line x1="20" y1="10" x2="20" y2="6" stroke="#000" strokeWidth="2" />
        </>
      ) : (
        <>
          <ellipse cx="20" cy="22" rx="14" ry="8" stroke="#000" strokeWidth="2" fill="none" />
          <circle cx="28" cy="18" r="5" stroke="#000" strokeWidth="2" fill="none" />
          <circle cx="30" cy="17" r="1" fill="#000" />
          <path d="M6 22 L10 20 M34 24 L38 22" stroke="#000" strokeWidth="1.5" />
        </>
      )}
    </svg>
  )
}

export function SketchAvatar({
  url,
  size,
  side,
  seed = 'avatar',
}: {
  url: string
  size: number
  side: 'left' | 'right'
  seed?: string
}) {
  const pathSeed = hashSeed(`${seed}-${side}`)
  const pad = 3
  const inner = size - pad * 2
  const framePath = sketchSquarePath(size, pathSeed)

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        className="absolute inset-0 pointer-events-none"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ overflow: 'visible' }}
      >
        <path
          d={framePath}
          fill="#fff"
          stroke="#000"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <div
        className="absolute flex items-center justify-center overflow-hidden bg-white"
        style={{
          left: pad + 1,
          top: pad + 1,
          width: inner - 2,
          height: inner - 2,
          clipPath: `inset(0 round 2px)`,
        }}
      >
        {url ? (
          <img src={url} alt="" className="w-full h-full object-cover" {...avatarImgProps(url)} />
        ) : (
          <PlaceholderIcon size={size} side={side} />
        )}
      </div>
    </div>
  )
}
