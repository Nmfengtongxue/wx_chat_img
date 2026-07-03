import { useCallback, useEffect, useState } from 'react'
import { FolderOpen, Type, Upload } from 'lucide-react'
import { useDoodleStore } from '../../store/useDoodleStore'
import {
  FONT_PRESETS,
  loadFontFromFile,
  pickLocalFont,
  supportsLocalFonts,
} from '../../utils/fonts'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      {children}
    </label>
  )
}

export function FontPicker() {
  const font = useDoodleStore((s) => s.settings.font)
  const updateFont = useDoodleStore((s) => s.updateFont)
  const [localFonts, setLocalFonts] = useState<{ family: string; fullName: string }[]>([])
  const [showFontList, setShowFontList] = useState(false)
  const [customFamily, setCustomFamily] = useState('')
  const [loading, setLoading] = useState(false)

  const applyFont = useCallback(
    async (family: string, extra?: { dataUrl?: string; postscriptName?: string }) => {
      if (extra?.dataUrl) {
        const { loadFontFromDataUrl } = await import('../../utils/fonts')
        const cleanFamily = family.replace(/"/g, '')
        await loadFontFromDataUrl(cleanFamily, extra.dataUrl)
        updateFont({ family: cleanFamily, dataUrl: extra.dataUrl, postscriptName: extra.postscriptName })
      } else {
        updateFont({ family, dataUrl: undefined, postscriptName: extra?.postscriptName })
      }
    },
    [updateFont],
  )

  useEffect(() => {
    if (font.dataUrl && font.family) {
      import('../../utils/fonts').then(({ loadFontFromDataUrl }) => {
        loadFontFromDataUrl(font.family.replace(/"/g, ''), font.dataUrl!).catch(() => {})
      })
    }
  }, [])

  const handleUpload = async (file: File) => {
    setLoading(true)
    try {
      const { family, dataUrl } = await loadFontFromFile(file)
      updateFont({ family, dataUrl })
    } finally {
      setLoading(false)
    }
  }

  const handleBrowseLocal = async () => {
    setLoading(true)
    try {
      const result = await pickLocalFont()
      if (result) {
        setLocalFonts(result.fonts.map((f) => ({ family: f.family, fullName: f.fullName })))
        setShowFontList(true)
      }
    } catch {
      alert('无法访问本地字体，请尝试上传字体文件，或手动输入字体名称')
    } finally {
      setLoading(false)
    }
  }

  const currentLabel =
    FONT_PRESETS.find((p) => p.family === font.family)?.label ??
    (font.dataUrl ? `已上传：${font.family}` : font.family)

  return (
    <div className="space-y-3">
      <Field label="当前字体">
        <div className="px-3 py-2 text-sm bg-slate-50 rounded-lg border border-slate-200 truncate">
          {currentLabel}
        </div>
      </Field>

      <Field label="预设字体（系统已安装）">
        <select
          className="input"
          value={FONT_PRESETS.some((p) => p.family === font.family) ? font.family : ''}
          onChange={(e) => e.target.value && applyFont(e.target.value)}
        >
          <option value="" disabled>
            选择预设…
          </option>
          {FONT_PRESETS.map((p) => (
            <option key={p.label} value={p.family} style={{ fontFamily: p.family }}>
              {p.label}
            </option>
          ))}
        </select>
      </Field>

      <div className="flex flex-wrap gap-2">
        <label className="btn-secondary cursor-pointer flex items-center gap-1.5">
          <Upload size={14} />
          {loading ? '加载中…' : '上传字体文件'}
          <input
            type="file"
            accept=".ttf,.otf,.woff,.woff2"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleUpload(f)
            }}
          />
        </label>

        {supportsLocalFonts() && (
          <button type="button" onClick={handleBrowseLocal} className="btn-secondary flex items-center gap-1.5">
            <FolderOpen size={14} />
            浏览本地字体
          </button>
        )}
      </div>

      {!supportsLocalFonts() && (
        <p className="text-[11px] text-slate-400 leading-relaxed">
          当前浏览器不支持直接浏览系统字体册。请使用「上传字体文件」，或在下方手动输入已安装的字体名称（如 Hannotate SC、站酷快乐体）。
        </p>
      )}

      {showFontList && localFonts.length > 0 && (
        <Field label={`本地字体（${localFonts.length} 个）`}>
          <div className="max-h-[160px] overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
            {localFonts.slice(0, 80).map((f) => (
              <button
                key={f.fullName}
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 transition-colors"
                style={{ fontFamily: `"${f.family}", sans-serif` }}
                onClick={() => {
                  applyFont(`"${f.family}", "PingFang SC", sans-serif`, {
                    postscriptName: f.fullName,
                  })
                  setShowFontList(false)
                }}
              >
                {f.fullName}
              </button>
            ))}
          </div>
        </Field>
      )}

      <Field label="手动输入字体名称">
        <div className="flex gap-2">
          <input
            value={customFamily}
            onChange={(e) => setCustomFamily(e.target.value)}
            className="input flex-1"
            placeholder='如 "Hannotate SC" 或 站酷快乐体'
          />
          <button
            type="button"
            className="btn-secondary shrink-0"
            onClick={() => {
              if (!customFamily.trim()) return
              const name = customFamily.includes('"') ? customFamily : `"${customFamily.trim()}"`
              applyFont(`${name}, "PingFang SC", sans-serif`)
            }}
          >
            <Type size={14} />
            应用
          </button>
        </div>
      </Field>

      <div
        className="p-3 rounded-lg border-2 border-dashed border-slate-200 text-center"
        style={{ fontFamily: font.family.includes('"') ? font.family : `"${font.family}", sans-serif` }}
      >
        字体预览：手写风格的中文 ABC 123
      </div>
    </div>
  )
}
