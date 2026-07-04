export function ClassicBubble({
  content,
  side,
  color,
  fontFamily,
  fontSize,
  maxWidth = 260,
}: {
  content: string
  side: 'left' | 'right'
  color: string
  fontFamily: string
  fontSize: number
  seed?: string
  maxWidth?: number
}) {
  return (
    <div
      className={`relative ${side === 'right' ? 'mr-1' : 'ml-1'}`}
      style={{ maxWidth, minWidth: 0 }}
    >
      <div
        className="relative inline-block px-4 py-2.5 text-black leading-snug whitespace-pre-wrap break-words"
        style={{
          backgroundColor: color,
          fontFamily,
          fontSize: `${fontSize}px`,
          border: '2.5px solid #000',
          borderRadius: side === 'left' ? '22px 20px 20px 18px' : '20px 22px 18px 20px',
          maxWidth,
        }}
      >
        {content}
        <svg
          className={`absolute top-[14px] ${side === 'left' ? '-left-[9px]' : '-right-[9px]'}`}
          width="10"
          height="14"
          viewBox="0 0 10 14"
          style={{ transform: side === 'right' ? 'scaleX(-1)' : undefined }}
        >
          <path
            d="M9 1C4 4 2 8 1 13L0 0Z"
            fill={color}
            stroke="#000"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  )
}
