import { useMemo, useState } from 'react'
import { Check, ImageIcon } from 'lucide-react'
import {
  AVATAR_CATEGORIES,
  AVATAR_PRESETS,
  getAvatarsByCategory,
  matchAvatarPreset,
} from '../../constants/avatarPresets'
import { hasPresetForFilename } from '../../constants/avatarBurstPresets'

interface AvatarPickerProps {
  value: string
  onChange: (url: string) => void
}

export function AvatarPicker({ value, onChange }: AvatarPickerProps) {
  const matched = matchAvatarPreset(value)
  const [categoryId, setCategoryId] = useState(
    () => matched?.categoryId ?? AVATAR_CATEGORIES[0]?.id ?? '',
  )

  const activeCategory = AVATAR_CATEGORIES.find((c) => c.id === categoryId) ?? AVATAR_CATEGORIES[0]
  const avatars = useMemo(
    () => (activeCategory ? getAvatarsByCategory(activeCategory.id) : []),
    [activeCategory],
  )

  return (
    <div className="space-y-3 pt-1">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-slate-500">从头像库选择</p>
        <span className="text-[10px] text-slate-400 shrink-0">
          {AVATAR_PRESETS.length} 张 · 均可拍一拍
        </span>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-0.5 -mx-1 px-1 scrollbar-thin">
        {AVATAR_CATEGORIES.map((cat) => {
          const count = AVATAR_PRESETS.filter((a) => a.categoryId === cat.id).length
          const active = cat.id === activeCategory?.id
          return (
            <button
              key={cat.id}
              type="button"
              title={cat.description}
              onClick={() => setCategoryId(cat.id)}
              className={`shrink-0 px-2.5 py-1.5 text-xs rounded-full border transition-colors whitespace-nowrap ${
                active
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'
              }`}
            >
              {cat.label}
              <span className={`ml-1 ${active ? 'text-emerald-100' : 'text-slate-400'}`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {activeCategory && (
        <p className="text-[11px] text-slate-400 leading-relaxed">{activeCategory.description}</p>
      )}

      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-[220px] overflow-y-auto pr-0.5">
        {avatars.map((avatar) => {
          const selected = matched?.id === avatar.id
          const canPat = hasPresetForFilename(avatar.filename)
          return (
            <button
              key={avatar.id}
              type="button"
              title={canPat ? `${avatar.label}（双击预览区头像可拍一拍）` : avatar.label}
              onClick={() => onChange(avatar.url)}
              className={`group relative aspect-square rounded-lg overflow-hidden border-2 transition-all active:scale-95 ${
                selected
                  ? 'border-emerald-500 ring-2 ring-emerald-400/40'
                  : 'border-slate-200 hover:border-emerald-300'
              }`}
            >
              <img
                src={avatar.url}
                alt={avatar.label}
                loading="lazy"
                className="w-full h-full object-cover bg-slate-100"
              />
              {canPat && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-amber-500/90 text-white flex items-center justify-center shadow-sm pointer-events-none">
                  <span className="text-[8px] leading-none">拍</span>
                </span>
              )}
              {selected && (
                <span className="absolute inset-0 flex items-center justify-center bg-emerald-600/25">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                    <Check size={12} strokeWidth={3} />
                  </span>
                </span>
              )}
              <span className="absolute inset-x-0 bottom-0 px-1 py-0.5 text-[9px] leading-tight text-white bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity truncate text-center">
                {avatar.label}
              </span>
            </button>
          )
        })}
      </div>

      {!value && (
        <p className="text-[11px] text-slate-400 flex items-center gap-1">
          <ImageIcon size={12} />
          点击上方缩略图，或左侧头像上传自定义图片
        </p>
      )}
    </div>
  )
}
