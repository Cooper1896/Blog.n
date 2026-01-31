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
app.use(bodyParser.json());

const HEXO_ROOT = path.join(__dirname, '..');
const POSTS_DIR = path.join(HEXO_ROOT, 'source', '_posts');
const CONFIG_FILE = path.join(HEXO_ROOT, '_config.yml');
const THEME_CONFIG_FILE = path.join(HEXO_ROOT, 'themes', 'anzhiyu', '_config.yml');
const UPLOADS_DIR = path.join(HEXO_ROOT, 'source', 'image');

// Ensure upload directory exists
if (!fs.existsSync(UPLOADS_DIR)){
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR)
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})
const upload = multer({ storage: storage })

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'dist')));

// Helper to read file content
const readFile = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
};

// Helper to write file content
const writeFile = (filePath, content) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, content, 'utf8', (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

// Get all posts
app.get('/api/posts', async (req, res) => {
  try {
    const files = await fs.promises.readdir(POSTS_DIR);
    const posts = [];

    for (const file of files) {
      if (file.endsWith('.md')) {
        const content = await readFile(path.join(POSTS_DIR, file));
        const parsed = matter(content);
        posts.push({
          filename: file,
          title: parsed.data.title || file.replace('.md', ''),
          date: parsed.data.date,
          tags: parsed.data.tags,
          categories: parsed.data.categories,
          cover: parsed.data.cover || parsed.data.top_img,
        });
      }
    }
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single post
app.get('/api/posts/:filename', async (req, res) => {
  try {
    const filePath = path.join(POSTS_DIR, req.params.filename);
    const content = await readFile(filePath);
    const parsed = matter(content);
    res.json({
      content: parsed.content,
      data: parsed.data,
      raw: content
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save a post
app.post('/api/posts/:filename', async (req, res) => {
  try {
    const filePath = path.join(POSTS_DIR, req.params.filename);
    const { content, data } = req.body;
    
    // Reconstruct file with front-matter
    const fileContent = matter.stringify(content, data);
    
    await writeFile(filePath, fileContent);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new post
app.post('/api/posts', async (req, res) => {
  try {
    const { title, layout = 'post' } = req.body;
    const filename = `${title}.md`;
    const filePath = path.join(POSTS_DIR, filename);
    
    // Check if file exists
    try {
      await fs.promises.access(filePath);
      return res.status(400).json({ error: 'Post already exists' });
    } catch (e) {
      // File doesn't exist, proceed
    }

    const date = new Date().toISOString();
    const content = `---
title: ${title}
date: ${date}
tags: []
categories: []
layout: ${layout}
---

`;
    await writeFile(filePath, content);
    res.json({ success: true, filename });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Config
app.get('/api/config', async (req, res) => {
  try {
    const configContent = await readFile(CONFIG_FILE);
    const themeConfigContent = await readFile(THEME_CONFIG_FILE).catch(() => ''); // Might not exist or different name
    
    res.json({
      config: yaml.load(configContent),
      themeConfig: themeConfigContent ? yaml.load(themeConfigContent) : {},
      configRaw: configContent,
      themeConfigRaw: themeConfigContent
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save Config
app.post('/api/config', async (req, res) => {
  try {
    const { type, content } = req.body; // type: 'site' or 'theme'
    const targetFile = type === 'theme' ? THEME_CONFIG_FILE : CONFIG_FILE;
    
    await writeFile(targetFile, content);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- New Features for Anheyu Replication ---

// Dashboard Stats
app.get('/api/stats', async (req, res) => {
  try {
    const files = await fs.promises.readdir(POSTS_DIR);
    let postCount = 0;
    let tagCount = 0;
    let categoryCount = 0;
    const tags = new Set();
    const categories = new Set();

    for (const file of files) {
      if (file.endsWith('.md')) {
        postCount++;
        // For a real large blog, we might cache this or just count files
        // To get tags/categories we need to parse content, which is slow for many files
        // For now, let's just return post count to be fast, or parse if needed.
        // Let's do a quick parse
        const content = await readFile(path.join(POSTS_DIR, file));
        const parsed = matter(content);
        if (parsed.data.tags) {
            if (Array.isArray(parsed.data.tags)) parsed.data.tags.forEach(t => tags.add(t));
            else tags.add(parsed.data.tags);
        }
        if (parsed.data.categories) {
            if (Array.isArray(parsed.data.categories)) parsed.data.categories.forEach(c => categories.add(c));
            else categories.add(parsed.data.categories);
        }
      }
    }
    
    res.json({
      posts: postCount,
      tags: tags.size,
      categories: categories.size,
      // Mock comments count or fetch from external if possible
      comments: 0 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Hexo Commands
app.post('/api/hexo/:command', (req, res) => {
  const { command } = req.params;
  const allowedCommands = ['clean', 'generate', 'deploy', 'server'];
  
  // Map 'g' to 'generate', 'd' to 'deploy' etc if needed, or just use full names
  // The frontend will send 'clean', 'generate', 'deploy'
  
  if (!allowedCommands.includes(command)) {
    return res.status(400).json({ error: 'Invalid command' });
  }

  const cmd = `hexo ${command}`;
  console.log(`Executing: ${cmd}`);

  exec(cmd, { cwd: HEXO_ROOT }, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return res.status(500).json({ error: error.message, details: stderr });
    }
    res.json({ output: stdout });
  });
});

// Image Upload
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({ 
    success: true, 
    filename: req.file.originalname,
    url: `/image/${req.file.originalname}` // Assuming hexo serves source/image at /image or similar
  });
});

// Media List
app.get('/api/media', async (req, res) => {
  try {
    if (!fs.existsSync(UPLOADS_DIR)) {
        return res.json([]);
    }
    const files = await fs.promises.readdir(UPLOADS_DIR);
    const images = files.filter(file => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file)).map(file => ({
        name: file,
        url: `/image/${file}`, // This depends on Hexo config, usually source/image -> /image/
        path: path.join(UPLOADS_DIR, file)
    }));
    res.json(images);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
