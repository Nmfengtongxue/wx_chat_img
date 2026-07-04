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

export function ClassicAvatar({
  url,
  size,
  side,
}: {
  url: string
  size: number
  side: 'left' | 'right'
  seed?: string
}) {
  return (
    <div
      className="shrink-0 overflow-hidden bg-white flex items-center justify-center"
      style={{
        width: size,
        height: size,
        border: '2.5px solid #000',
        borderRadius: '3px',
        boxShadow: '1px 1px 0 rgba(0,0,0,0.1)',
      }}
    >
      {url ? (
          <img src={url} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
        ) : (
        <PlaceholderIcon size={size} side={side} />
      )}
    </div>
  )
}
