import { useMemo, useRef, useState } from 'react'
import { Sparkles, Play } from 'lucide-react'
import { AvatarBurstOverlay } from './components/effects/AvatarBurstOverlay'
import { EffectPreviewPhone } from './components/effects/EffectPreviewPhone'
import {
  AVATAR_BURST_PRESETS,
  getPresetsByCategory,
} from './constants/avatarBurstPresets'
import { AVATAR_CATEGORIES } from './constants/avatarPresets'
import type { AvatarBurstPreset } from './effects/types'

const MOTION_LABEL: Record<string, string> = {
  rise: '缓缓上浮',
  fall: '轻柔飘落',
  bounce: '弹跳四溅',
  burst: '中心爆发',
  swirl: '漩涡环绕',
}

export function AvatarEffectDemo() {
  const stageRef = useRef<HTMLDivElement>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const presets = useMemo(() => {
    if (categoryFilter === 'all') return AVATAR_BURST_PRESETS
    return getPresetsByCategory(categoryFilter)
  }, [categoryFilter])

  const activePreset = AVATAR_BURST_PRESETS.find((p) => p.id === activeId)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-6 pb-12">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="text-amber-400" size={22} />
          <h1 className="text-xl font-semibold">头像拍一拍特效 · 全库预览</h1>
        </div>
        <p className="text-sm text-slate-400 leading-relaxed mb-4 max-w-2xl">
          共 {AVATAR_BURST_PRESETS.length} 张内置头像，每张对应独立满屏粒子特效；
          限定在<strong className="text-slate-300 font-normal">微信聊天消息区</strong>
          内展示，粒子为透明 PNG 主体。
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          <FilterChip active={categoryFilter === 'all'} onClick={() => setCategoryFilter('all')}>
            全部
          </FilterChip>
          {AVATAR_CATEGORIES.map((c) => (
            <FilterChip
              key={c.id}
              active={categoryFilter === c.id}
              onClick={() => setCategoryFilter(c.id)}
            >
              {c.label}
            </FilterChip>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
          <div className="w-full lg:w-[360px] space-y-2 shrink-0 max-h-[72vh] overflow-y-auto pr-1">
            {presets.map((preset) => (
              <PresetCard
                key={preset.id}
                preset={preset}
                active={activeId === preset.id}
                onPlay={() => setActiveId(preset.id)}
              />
            ))}

            <a href="#/" className="inline-block text-sm text-emerald-400 hover:text-emerald-300 pt-2">
              ← 返回聊天生成器
            </a>
          </div>

          <EffectPreviewPhone stageRef={stageRef}>
            {activePreset && (
              <AvatarBurstOverlay
                preset={activePreset}
                active={!!activeId}
                onClose={() => setActiveId(null)}
                stageRef={stageRef}
              />
            )}
          </EffectPreviewPhone>
        </div>
      </div>
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs transition-colors ${
        active
          ? 'bg-emerald-600 text-white'
          : 'bg-white/10 text-slate-300 hover:bg-white/15'
      }`}
    >
      {children}
    </button>
  )
}

function PresetCard({
  preset,
  active,
  onPlay,
}: {
  preset: AvatarBurstPreset
  active: boolean
  onPlay: () => void
}) {
  return (
    <article
      className={`rounded-xl border backdrop-blur overflow-hidden transition-colors ${
        active ? 'border-emerald-500/60 bg-emerald-950/30' : 'border-white/10 bg-white/5'
      }`}
    >
      <div className="flex gap-2.5 p-2.5">
        <div className="w-12 h-12 rounded-lg bg-[#ededed]/10 flex items-center justify-center shrink-0">
          <img
            src={preset.avatarSrc}
            alt={preset.name}
            className="max-w-[44px] max-h-[44px] object-contain"
            loading="lazy"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-emerald-400/80 truncate">{preset.category.replace(/^\d+-/, '')}</p>
          <h2 className="font-medium text-xs truncate">{preset.name}</h2>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {MOTION_LABEL[preset.motion] ?? preset.motion} · {preset.emotion.split(' · ')[0]}
          </p>
        </div>
        <button
          type="button"
          className="self-center shrink-0 flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1.5 text-[11px] font-medium"
          onClick={onPlay}
        >
          <Play size={12} />
          播放
        </button>
      </div>
    </article>
  )
}
