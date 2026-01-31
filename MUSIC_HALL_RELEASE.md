# 🎵 博客音乐馆本地化功能更新 (Music Hall Localization Update)

本次更新为博客添加了完整的本地音乐播放支持，允许用户直接播放服务器/本地的 MP3 文件，并自动关联歌词与封面，彻底解决了依赖第三方音乐平台（如网易云）可能出现的资源失效或版权限制问题，同时完美保留了 AnZhiYu 主题原有的精美 UI 布局。

## ✨ 新特性 (New Features)

- **本地音乐库支持**
  - 音乐馆现在直接读取本地 `source/music/` 目录下的音频文件。
  - 不再强制依赖网易云音乐 ID，实现音乐资源的完全自主控制。

- **智能资源扫描脚本**
  - 新增 `generate_music.js` 自动化脚本。
  - **自动识别**：自动扫描 `.mp3` 文件。
  - **智能关联**：自动匹配同名的 `.lrc` 歌词文件和封面图片（支持 `.jpg`, `.png`, `.webp` 等）。
  - **元数据解析**：尝试从文件名（格式：`歌名 - 歌手.mp3`）中自动提取歌曲信息。

- **无缝 UI 集成**
  - 采用 `meting-js` API 劫持技术，在不修改任何 CSS 样式文件的情况下，完美复刻了主题原生的音乐播放器界面。
  - 支持全局播放器（左下角）与音乐馆页面的无缝切换。
  - 保留了背景模糊、歌词滚动、黑胶唱片旋转等所有视觉特效。

## 🛠️ 技术改进 (Technical Improvements)

- **Netease Bypass (网易云绕过)**
  - 修改了 `utils.js` 中的播放列表获取逻辑。
  - 利用 `meting-js` 的 `api` 属性重定向至本地生成的 `/json/music.json`，欺骗播放器加载本地数据。

- **NPM 脚本集成**
  - 在 `package.json` 中集成了快捷命令，方便日常维护。

## 🐛 修复 (Bug Fixes)

- **布局错位修复**：解决了之前因手动初始化 `APlayer` 导致 DOM 结构变化，进而引发的 CSS 选择器失效和页面布局崩坏问题。现在通过原生标签注入，确保了 100% 的样式兼容性。

---

## 📖 使用指南 (How to Use)

### 1. 添加音乐
将你的音乐文件放入博客根目录下的 `source/music/` 文件夹中。
建议的文件命名格式：
- 音频：`歌名 - 歌手.mp3`
- 歌词：`歌名 - 歌手.lrc` (可选)
- 封面：`歌名 - 歌手.jpg` (可选)

### 2. 生成列表
在终端中运行以下命令来更新音乐列表：

```bash
npm run music
# 或者
npm run m
```

此命令会扫描文件夹并生成 `source/json/music.json`。

### 3. 预览/部署
正常启动 Hexo 服务器即可看到效果：

```bash
hexo s
```

---

## 📂 文件变更清单 (File Changes)

| 文件路径 | 变更类型 | 说明 |
| :--- | :--- | :--- |
| `generate_music.js` | ✨ 新增 | 音乐文件扫描与 JSON 生成脚本 |
| `package.json` | 🔧 修改 | 添加 `music` 运行脚本 |
| `themes/anzhiyu/source/js/utils.js` | 🔧 修改 | 重写 `getCustomPlayList` 方法，注入本地 API |
| `themes/anzhiyu/_config.yml` | ⚙️ 配置 | 调整 `music_page_default` 配置 |
