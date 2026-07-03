import { useChatStore } from '../../store/useChatStore'
import type { NetworkType } from '../../types'

function SignalBars({ count, max = 4 }: { count: number; max?: number }) {
  return (
    <div className="flex items-end gap-[1.5px] h-[10px]">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className="w-[3px] rounded-[1px]"
          style={{
            height: `${4 + i * 2.5}px`,
            background: i < count ? '#000' : 'rgba(0,0,0,0.25)',
          }}
        />
      ))}
    </div>
  )
}

function WifiIcon({ bars }: { bars: number }) {
  const opacity = (i: number) => (i <= bars ? 1 : 0.25)
  return (
    <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
      <path
        d="M8 11.5a1 1 0 100-2 1 1 0 000 2z"
        fill="#000"
        opacity={opacity(3)}
      />
      <path
        d="M5.5 8.5a3.5 3.5 0 014.5 0"
        stroke="#000"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity={opacity(2)}
      />
      <path
        d="M2.5 5.5a7 7 0 019 0"
        stroke="#000"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity={opacity(1)}
      />
    </svg>
  )
}

function NetworkLabel({ type }: { type: NetworkType }) {
  const labels: Record<NetworkType, string> = {
    wifi: '',
    '3g': '3G',
    '4g': '4G',
    '5g': '5G',
  }
  if (type === 'wifi') return null
  return (
    <span className="text-[10px] font-semibold tracking-tight leading-none">
      {labels[type]}
    </span>
  )
}

function BatteryIcon({ level, charging }: { level: number; charging: boolean }) {
  const fill = Math.max(0, Math.min(100, level))
  return (
    <div className="flex items-center gap-[2px]">
      {charging && (
        <svg width="6" height="10" viewBox="0 0 6 10" fill="#000">
          <path d="M3 0L5 4H3.5V10L1 4H2.5V0H3z" />
        </svg>
      )}
      <div className="relative w-[22px] h-[11px] border border-black rounded-[2px] p-[1.5px]">
        <div
          className="h-full rounded-[1px] bg-black transition-all"
          style={{ width: `${fill}%` }}
        />
        <div className="absolute -right-[3px] top-1/2 -translate-y-1/2 w-[2px] h-[4px] bg-black rounded-r-sm" />
      </div>
    </div>
  )
}

export function StatusBar() {
  const phone = useChatStore((s) => s.phone)

  return (
    <div className="flex items-center justify-between px-[22px] pt-[12px] pb-[6px] text-black bg-[#ededed]">
      <span className="text-[15px] font-semibold tracking-tight w-[54px]">
        {phone.timeHour.padStart(2, '0')}:{phone.timeMinute.padStart(2, '0')}
      </span>

      <div className="flex items-center gap-[5px]">
        <SignalBars count={phone.signalBars} />
        {phone.networkType === 'wifi' ? (
          <WifiIcon bars={phone.wifiBars} />
        ) : (
          <NetworkLabel type={phone.networkType} />
        )}
        <BatteryIcon level={phone.battery} charging={phone.charging} />
      </div>
    </div>
  )
}
