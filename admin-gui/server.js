import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import yaml from 'js-yaml';
import { exec } from 'child_process';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

const HEXO_ROOT = path.join(__dirname, '..');
const POSTS_DIR = path.join(HEXO_ROOT, 'source', '_posts');
const DATA_DIR = path.join(HEXO_ROOT, 'source', '_data');
const CONFIG_FILE = path.join(HEXO_ROOT, '_config.yml');
const THEME_CONFIG_FILE = path.join(HEXO_ROOT, 'themes', 'anzhiyu', '_config.yml');
const UPLOADS_DIR = path.join(HEXO_ROOT, 'source', 'image');
const MUSIC_DIR = path.join(HEXO_ROOT, 'source', 'music');
const MUSIC_JSON = path.join(HEXO_ROOT, 'source', 'json', 'music.json');

// Ensure directories exist
[UPLOADS_DIR, DATA_DIR, MUSIC_DIR, path.dirname(MUSIC_JSON)].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Serve static files
app.use(express.static(path.join(__dirname, 'dist')));
app.use('/image', express.static(UPLOADS_DIR));
app.use('/music', express.static(MUSIC_DIR));

// Music file upload storage
const musicStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, MUSIC_DIR),
  filename: (req, file, cb) => cb(null, file.originalname),
});
const musicUpload = multer({ storage: musicStorage, limits: { fileSize: 50 * 1024 * 1024 } });

// ========== Helper Functions ==========
const readFile = (filePath) => fs.promises.readFile(filePath, 'utf8');
const writeFile = (filePath, content) => fs.promises.writeFile(filePath, content, 'utf8');

const getFileStats = async (filePath) => {
  try {
    const stats = await fs.promises.stat(filePath);
    return { size: stats.size, modified: stats.mtime, created: stats.birthtime };
  } catch { return null; }
};

// ========== Dashboard Stats ==========
app.get('/api/stats', async (req, res) => {
  try {
    const files = await fs.promises.readdir(POSTS_DIR);
    const tags = new Set();
    const categories = new Set();
    let totalWords = 0;
    const recentPosts = [];

    for (const file of files) {
      if (!file.endsWith('.md')) continue;
      const content = await readFile(path.join(POSTS_DIR, file));
      const parsed = matter(content);
      totalWords += parsed.content.length;

      if (parsed.data.tags) {
        (Array.isArray(parsed.data.tags) ? parsed.data.tags : [parsed.data.tags]).forEach(t => tags.add(t));
      }
      if (parsed.data.categories) {
        (Array.isArray(parsed.data.categories) ? parsed.data.categories : [parsed.data.categories]).forEach(c => categories.add(c));
      }
      recentPosts.push({
        filename: file,
        title: parsed.data.title || file.replace('.md', ''),
        date: parsed.data.date,
        categories: parsed.data.categories,
      });
    }

    // 随笔计数
    let essayCount = 0;
    try {
      const essayContent = await readFile(path.join(DATA_DIR, 'essay.yml'));
      const essayData = yaml.load(essayContent);
      if (Array.isArray(essayData)) {
        essayData.forEach(section => {
          if (section.essay_list) essayCount += section.essay_list.length;
        });
      }
    } catch {}

    // 图片计数
    let imageCount = 0;
    try {
      const imgFiles = await fs.promises.readdir(UPLOADS_DIR);
      imageCount = imgFiles.filter(f => /\.(jpg|jpeg|png|gif|webp|svg|avif|ico)$/i.test(f)).length;
    } catch {}

    recentPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      posts: files.filter(f => f.endsWith('.md')).length,
      tags: tags.size,
      categories: categories.size,
      essays: essayCount,
      images: imageCount,
      totalWords,
      recentPosts: recentPosts.slice(0, 5),
      tagList: [...tags],
      categoryList: [...categories],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== Posts API ==========
app.get('/api/posts', async (req, res) => {
  try {
    const files = await fs.promises.readdir(POSTS_DIR);
    const posts = [];

    for (const file of files) {
      if (!file.endsWith('.md')) continue;
      const filePath = path.join(POSTS_DIR, file);
      const content = await readFile(filePath);
      const parsed = matter(content);
      const stats = await getFileStats(filePath);

      posts.push({
        filename: file,
        title: parsed.data.title || file.replace('.md', ''),
        date: parsed.data.date,
        updated: parsed.data.updated || (stats ? stats.modified : null),
        tags: parsed.data.tags || [],
        categories: parsed.data.categories || [],
        cover: parsed.data.cover || parsed.data.top_img || '',
        description: parsed.data.description || '',
        wordCount: parsed.content.length,
        top: parsed.data.top || false,
        draft: parsed.data.draft || false,
      });
    }
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/posts/:filename', async (req, res) => {
  try {
    const filePath = path.join(POSTS_DIR, req.params.filename);
    const content = await readFile(filePath);
    const parsed = matter(content);
    res.json({ content: parsed.content, data: parsed.data, raw: content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/posts/:filename', async (req, res) => {
  try {
    const filePath = path.join(POSTS_DIR, req.params.filename);
    const { content, data } = req.body;
    const fileContent = matter.stringify(content, data);
    await writeFile(filePath, fileContent);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/posts', async (req, res) => {
  try {
    const { title, tags = [], categories = [] } = req.body;
    const filename = `${title}.md`;
    const filePath = path.join(POSTS_DIR, filename);

    try {
      await fs.promises.access(filePath);
      return res.status(400).json({ error: '文章已存在' });
    } catch {}

    const date = new Date().toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '');
    const frontMatter = { title, date, tags, categories, cover: '', description: '' };
    const content = matter.stringify('\n', frontMatter);
    await writeFile(filePath, content);
    res.json({ success: true, filename });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/posts/:filename', async (req, res) => {
  try {
    const filePath = path.join(POSTS_DIR, req.params.filename);
    await fs.promises.unlink(filePath);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== Config API ==========
app.get('/api/config', async (req, res) => {
  try {
    const configContent = await readFile(CONFIG_FILE);
    let themeConfigContent = '';
    try { themeConfigContent = await readFile(THEME_CONFIG_FILE); } catch {}

    res.json({
      config: yaml.load(configContent),
      themeConfig: themeConfigContent ? yaml.load(themeConfigContent) : {},
      configRaw: configContent,
      themeConfigRaw: themeConfigContent,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/config', async (req, res) => {
  try {
    const { type, content } = req.body;
    const targetFile = type === 'theme' ? THEME_CONFIG_FILE : CONFIG_FILE;
    const backup = await readFile(targetFile);
    await writeFile(targetFile + '.bak', backup);
    await writeFile(targetFile, content);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== Essay (随笔) API ==========
const ESSAY_FILE = path.join(DATA_DIR, 'essay.yml');

app.get('/api/essays', async (req, res) => {
  try {
    const content = await readFile(ESSAY_FILE);
    const data = yaml.load(content) || [];
    res.json(data);
  } catch (err) {
    if (err.code === 'ENOENT') return res.json([]);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/essays', async (req, res) => {
  try {
    const data = req.body;
    const content = yaml.dump(data, { lineWidth: -1, quotingType: '"', forceQuotes: false });
    await writeFile(ESSAY_FILE, content);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== Data Files API ==========
app.get('/api/data', async (req, res) => {
  try {
    const files = await fs.promises.readdir(DATA_DIR);
    const dataFiles = files.filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));
    const result = [];
    for (const file of dataFiles) {
      const content = await readFile(path.join(DATA_DIR, file));
      result.push({ filename: file, name: file.replace(/\.(yml|yaml)$/, ''), content });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/data/:filename', async (req, res) => {
  try {
    const filePath = path.join(DATA_DIR, req.params.filename);
    const content = await readFile(filePath);
    res.json({ content, data: yaml.load(content) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/data/:filename', async (req, res) => {
  try {
    const filePath = path.join(DATA_DIR, req.params.filename);
    const { content } = req.body;
    await writeFile(filePath, content);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== Media API ==========
app.get('/api/media', async (req, res) => {
  try {
    if (!fs.existsSync(UPLOADS_DIR)) return res.json([]);
    const files = await fs.promises.readdir(UPLOADS_DIR);
    const images = [];
    for (const file of files) {
      if (!/\.(jpg|jpeg|png|gif|webp|svg|avif|ico)$/i.test(file)) continue;
      const stats = await getFileStats(path.join(UPLOADS_DIR, file));
      images.push({
        name: file,
        url: `/image/${file}`,
        size: stats ? stats.size : 0,
        modified: stats ? stats.modified : null,
      });
    }
    images.sort((a, b) => new Date(b.modified) - new Date(a.modified));
    res.json(images);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '未选择文件' });
  res.json({
    success: true,
    filename: req.file.filename,
    url: `/image/${req.file.filename}`,
  });
});

app.post('/api/upload/multiple', upload.array('files', 20), (req, res) => {
  if (!req.files || req.files.length === 0) return res.status(400).json({ error: '未选择文件' });
  const uploaded = req.files.map(f => ({ filename: f.filename, url: `/image/${f.filename}` }));
  res.json({ success: true, files: uploaded });
});

app.delete('/api/media/:filename', async (req, res) => {
  try {
    const filePath = path.join(UPLOADS_DIR, req.params.filename);
    await fs.promises.unlink(filePath);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== Music API ==========
app.get('/api/music', async (req, res) => {
  try {
    const content = await readFile(MUSIC_JSON);
    res.json(JSON.parse(content));
  } catch (err) {
    if (err.code === 'ENOENT') return res.json([]);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/music', async (req, res) => {
  try {
    const data = req.body;
    await writeFile(MUSIC_JSON, JSON.stringify(data, null, 2));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/music/files', async (req, res) => {
  try {
    if (!fs.existsSync(MUSIC_DIR)) return res.json([]);
    const files = await fs.promises.readdir(MUSIC_DIR);
    res.json(files.filter(f => !f.startsWith('.')));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/music/upload', musicUpload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '未选择文件' });
  res.json({ success: true, filename: req.file.filename, url: `/music/${req.file.filename}` });
});

app.post('/api/music/generate', (req, res) => {
  const scriptPath = path.join(HEXO_ROOT, 'generate_music.js');
  if (!fs.existsSync(scriptPath)) {
    return res.status(404).json({ error: 'generate_music.js 不存在' });
  }
  exec(`node "${scriptPath}"`, { cwd: HEXO_ROOT, timeout: 30000 }, (error, stdout, stderr) => {
    if (error) return res.status(500).json({ error: error.message, details: stderr });
    res.json({ success: true, message: '音乐列表已重新生成', output: stdout });
  });
});

app.delete('/api/music/:index', async (req, res) => {
  try {
    const content = await readFile(MUSIC_JSON);
    const songs = JSON.parse(content);
    const idx = parseInt(req.params.index, 10);
    if (idx < 0 || idx >= songs.length) return res.status(400).json({ error: '索引无效' });
    songs.splice(idx, 1);
    await writeFile(MUSIC_JSON, JSON.stringify(songs, null, 2));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== Git API ==========
app.get('/api/git/status', (req, res) => {
  exec('git status --porcelain && echo "---BRANCH---" && git branch --show-current && echo "---REMOTE---" && git remote -v', { cwd: HEXO_ROOT }, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: 'Git 未初始化或不可用', details: error.message });
    }
    const parts = stdout.split('---BRANCH---');
    const statusLines = parts[0].trim();
    const rest = (parts[1] || '').split('---REMOTE---');
    const branch = rest[0]?.trim() || 'unknown';
    const remoteRaw = rest[1]?.trim() || '';

    const changes = statusLines ? statusLines.split('\n').map(line => ({
      status: line.substring(0, 2).trim(),
      file: line.substring(3),
    })) : [];

    // Parse remote URL
    let remoteUrl = '';
    if (remoteRaw) {
      const match = remoteRaw.match(/origin\s+(\S+)\s+\(push\)/);
      if (match) remoteUrl = match[1];
    }

    res.json({
      branch,
      changes,
      changedCount: changes.length,
      remoteUrl,
      clean: changes.length === 0,
    });
  });
});

app.post('/api/git/sync', (req, res) => {
  const { message } = req.body;
  const commitMsg = message || `Blog update: ${new Date().toLocaleString('zh-CN')}`;

  // 依次执行: git add . -> git commit -> git push
  const commands = [
    'git add -A',
    `git commit -m "${commitMsg.replace(/"/g, '\\"')}"`,
    'git push origin HEAD',
  ];

  const fullCmd = commands.join(' && ');
  console.log(`执行 Git 同步: ${fullCmd}`);

  exec(fullCmd, { cwd: HEXO_ROOT, timeout: 60000 }, (error, stdout, stderr) => {
    if (error) {
      // 如果是 "nothing to commit" 不算真正的错误
      if (error.message.includes('nothing to commit') || stderr.includes('nothing to commit')) {
        return res.json({ output: '没有需要提交的更改', warnings: '' });
      }
      console.error(`Git 同步错误: ${error}`);
      return res.status(500).json({ error: error.message, details: stderr || stdout });
    }
    res.json({ output: stdout, warnings: stderr });
  });
});

app.post('/api/git/pull', (req, res) => {
  exec('git pull origin HEAD', { cwd: HEXO_ROOT, timeout: 60000 }, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: error.message, details: stderr });
    }
    res.json({ output: stdout, warnings: stderr });
  });
});

// ========== Hexo Commands ==========
app.post('/api/hexo/:command', (req, res) => {
  const { command } = req.params;
  const allowedCommands = ['clean', 'generate', 'deploy', 'server'];
  if (!allowedCommands.includes(command)) {
    return res.status(400).json({ error: '无效命令' });
  }

  const cmd = `npx hexo ${command}`;
  console.log(`执行: ${cmd}`);

  exec(cmd, { cwd: HEXO_ROOT, timeout: 120000 }, (error, stdout, stderr) => {
    if (error) {
      console.error(`执行错误: ${error}`);
      return res.status(500).json({ error: error.message, details: stderr });
    }
    res.json({ output: stdout, warnings: stderr });
  });
});

// ========== System Info ==========
app.get('/api/system', async (req, res) => {
  try {
    const packageJson = JSON.parse(await readFile(path.join(HEXO_ROOT, 'package.json')));
    const themePackageJson = JSON.parse(await readFile(path.join(HEXO_ROOT, 'themes', 'anzhiyu', 'package.json')));
    res.json({
      hexoVersion: packageJson.dependencies?.hexo || 'unknown',
      themeVersion: themePackageJson.version || 'unknown',
      themeName: 'AnZhiYu',
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SPA fallback
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n  🐟 AnZhiYu Admin Server`);
  console.log(`  ➜  Local:   http://localhost:${PORT}`);
  console.log(`  ➜  API:     http://localhost:${PORT}/api\n`);
});
