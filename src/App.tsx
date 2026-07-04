import { useRef, useState } from 'react'
import {
  Camera,
  ClipboardCopy,
  Download,
  MessageCircle,
  Pencil,
  RotateCcw,
  Upload,
} from 'lucide-react'
import { DoodleEditorPanel } from './components/doodle/DoodleEditorPanel'
import { DoodlePreview } from './components/doodle/DoodlePreview'
import { EditorPanel } from './components/editor/EditorPanel'
import { PhonePreview } from './components/preview/PhonePreview'
import { usePreviewViewportHeight } from './hooks/usePreviewViewportHeight'
import { useChatStore } from './store/useChatStore'
import { useDoodleStore } from './store/useDoodleStore'
import { copyScreenshot, exportScreenshot } from './utils/helpers'

export type AppMode = 'wechat' | 'doodle'

export default function App() {
  const previewWrapRef = useRef<HTMLDivElement>(null)
  const editorPanelRef = useRef<HTMLElement>(null)
  const [status, setStatus] = useState('')
  const [mode, setMode] = useState<AppMode>('doodle')

  const previewHeight = usePreviewViewportHeight(editorPanelRef, mode === 'doodle')

  const importWechat = useChatStore((s) => s.importData)
  const resetWechat = useChatStore((s) => s.resetAll)
  const importDoodle = useDoodleStore((s) => s.importData)
  const resetDoodle = useDoodleStore((s) => s.resetAll)
  const doodleSettings = useDoodleStore((s) => s.settings)

  const getTarget = () =>
    previewWrapRef.current?.querySelector('[data-screenshot-target]') as HTMLElement | null

  const exportBg = mode === 'doodle' ? '#ffffff' : '#000000'
  const exportName = mode === 'doodle' ? '手绘对话.png' : '微信聊天截图.png'

  const handleExport = async () => {
    const el = getTarget()
    if (!el) return
    try {
      setStatus('正在生成截图…')
      await exportScreenshot(el, {
        filename: exportName,
        backgroundColor: exportBg,
        long: true,
        fitContent: mode === 'doodle',
        font: mode === 'doodle' ? doodleSettings.font : undefined,
      })
      setStatus('截图已下载')
      setTimeout(() => setStatus(''), 2000)
    } catch {
      setStatus('导出失败，请重试')
    }
  }

  const handleCopy = async () => {
    const el = getTarget()
    if (!el) return
    try {
      setStatus('正在复制…')
      await copyScreenshot(el, exportBg, true, mode === 'doodle', mode === 'doodle' ? doodleSettings.font : undefined)
      setStatus('已复制到剪贴板')
      setTimeout(() => setStatus(''), 2000)
    } catch {
      setStatus('复制失败，请使用下载')
    }
  }

  const handleExportJson = () => {
    if (mode === 'wechat') {
      const { users, phone, chat, messages } = useChatStore.getState()
      downloadJson({ mode: 'wechat', users, phone, chat, messages }, '微信聊天配置.json')
    } else {
      const { users, settings, messages } = useDoodleStore.getState()
      downloadJson({ mode: 'doodle', users, settings, messages }, '手绘对话配置.json')
    }
  }

  const handleImportJson = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        const data = JSON.parse(await file.text())
        if (data.mode === 'doodle') {
          setMode('doodle')
          importDoodle(data)
        } else {
          setMode('wechat')
          importWechat(data)
        }
        setStatus('配置已导入')
        setTimeout(() => setStatus(''), 2000)
      } catch {
        setStatus('导入失败，请检查 JSON 格式')
      }
    }
    input.click()
  }

  const handleReset = () => {
    if (!confirm('重置当前模式的全部内容？')) return
    if (mode === 'wechat') resetWechat()
    else resetDoodle()
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3">
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate">
              {mode === 'wechat' ? '微信对话生成器' : '手绘对话生成器'}
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-400 lg:hidden">
              上方预览 · 下方编辑 · 数据保存在本地
            </p>
            <p className="text-[11px] sm:text-xs text-slate-400 hidden lg:block">
              左侧编辑 · 右侧实时预览 · 数据保存在本地
            </p>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {status && <span className="text-xs text-emerald-600 hidden md:inline">{status}</span>}
            <button type="button" onClick={handleImportJson} className="btn-ghost" title="导入配置">
              <Upload size={16} />
            </button>
            <button type="button" onClick={handleExportJson} className="btn-ghost" title="导出配置">
              <Download size={16} />
            </button>
            <button type="button" onClick={handleReset} className="btn-ghost" title="重置">
              <RotateCcw size={16} />
            </button>
            <button type="button" onClick={handleCopy} className="btn-secondary hidden sm:flex">
              <ClipboardCopy size={16} />
              复制
            </button>
            <button type="button" onClick={handleExport} className="btn-primary">
              <Camera size={16} />
              下载截图
            </button>
          </div>
        </div>

        <div className="flex px-4 sm:px-6 pb-0 gap-1">
          <ModeTab
            active={mode === 'doodle'}
            onClick={() => setMode('doodle')}
            icon={<Pencil size={15} />}
            label="手绘对话"
          />
          <ModeTab
            active={mode === 'wechat'}
            onClick={() => setMode('wechat')}
            icon={<MessageCircle size={15} />}
            label="微信仿真"
          />
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-6 p-4 sm:p-6 max-w-[1400px] mx-auto w-full lg:items-stretch">
        <section
          ref={previewWrapRef}
          className="order-1 lg:order-2 flex-1 flex flex-col items-center justify-start shrink-0 lg:min-h-0"
        >
          {mode === 'wechat' ? (
            <PhonePreview />
          ) : (
            <DoodlePreview viewportHeight={previewHeight} />
          )}
        </section>

        <section
          ref={editorPanelRef}
          className="order-2 lg:order-1 lg:w-[420px] xl:w-[460px] shrink-0 flex flex-col min-h-0 lg:max-h-[calc(100vh-128px)]"
        >
          <div className="flex-1 min-h-0 flex flex-col">
            {mode === 'wechat' ? <EditorPanel /> : <DoodleEditorPanel />}
          </div>
        </section>
      </main>

      <footer className="text-center text-[11px] text-slate-400 py-4 px-4 border-t border-slate-100">
        仅供娱乐与内容创作 · 请勿用于欺诈等违法用途
      </footer>
    </div>
  )
}

function ModeTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
        active
          ? 'text-emerald-700 border-emerald-600 bg-emerald-50/60'
          : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
}
