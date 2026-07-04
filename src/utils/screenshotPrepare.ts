/** 导出截图前通知气泡/布局组件重新测量 */
export const SCREENSHOT_REMEASURE_EVENT = 'wxchat:screenshot-remeasure'

export async function flushScreenshotLayout(root: HTMLElement) {
  window.dispatchEvent(new CustomEvent(SCREENSHOT_REMEASURE_EVENT))
  await document.fonts.ready
  await new Promise<void>((r) => {
    requestAnimationFrame(() => requestAnimationFrame(() => r()))
  })
  void root.offsetHeight
  void root.scrollHeight
  // 再等一帧，确保 React 测量 state 已提交到 DOM
  await new Promise<void>((r) => requestAnimationFrame(() => r()))
}
