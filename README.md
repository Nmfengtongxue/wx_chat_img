# 微信对话生成器

在线模拟制作微信聊天截图，复刻自 [jxriyang.com/wx](https://www.jxriyang.com/wx/)，并按同类产品主流做法优化了操作界面。

## 两种模式

### 微信仿真
完整复刻微信聊天界面，支持文字、图片、语音、红包、转账等。

### 手绘对话
参考手绘漫画风格对话截图：
- 白底 + 绿色手绘气泡 + 黑色描边
- 左右两侧方形头像（可手动上传）
- **自定义字体**：上传 `.ttf/.otf/.woff`、浏览本地字体册（Chrome）、或手动输入字体名
- 顶部时间、气泡颜色、字号、画布宽度可调
- 内置「拖鞋对话」「失眠对话」示例

顶部 Tab 可切换两种模式，配置分别保存在本地。

## 功能

- **消息类型**：文字、图片、语音、红包、转账、时间分隔
- **外观设置**：信号、网络、WiFi、电量、充电、听筒模式、未读数、聊天标题、背景图
- **联系人管理**：多用户、自定义头像、标记「我」
- **消息编辑**：拖拽排序、点击预览区选中编辑、快捷添加按钮
- **导出**：高清 PNG 截图下载、复制到剪贴板
- **配置**：JSON 导入/导出，本地自动保存

## 界面优化（对比原版）

| 原版 | 优化后 |
|------|--------|
| 表单堆叠，操作分散 | 三 Tab：消息 / 外观 / 联系人 |
| 需填表后点添加 | 快捷按钮 + 消息列表面板 |
| 难以调整顺序 | 拖拽排序 |
| 编辑与预览分离 | 点击预览消息即选中编辑 |
| 无配置持久化 | localStorage 自动保存 + JSON 导入导出 |

## 开发

```bash
npm install
npm run dev
```

本地访问：**http://127.0.0.1:5173/**（Cursor Simple Browser 与外部浏览器均可）

在 Cursor 中：`Cmd+Shift+P` → `Tasks: Run Task` → `启动开发服务器`，再用 Simple Browser 打开上述地址。

在线访问：
- GitHub Pages：https://nmfengtongxue.github.io/wx_chat_img/
- Cloudflare Pages：https://wx-chat-img.pages.dev/（需在 GitHub 配置 `CLOUDFLARE_API_TOKEN` 与 `CLOUDFLARE_ACCOUNT_ID`）
- 腾讯云 CloudBase：https://wx-chat-images-d5g75hzivc47793bd-1253877908.tcloudbaseapp.com/

## 构建

```bash
npm run build
npm run preview
```

## 技术栈

React 19 · TypeScript · Vite · Tailwind CSS · Zustand · html-to-image · @dnd-kit

## 声明

仅供娱乐与内容创作，请勿用于欺诈等违法用途。
