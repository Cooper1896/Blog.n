const fs = require('fs');
const path = require('path');

// 配置路径
const musicDir = path.join(__dirname, 'source', 'music');
const outputDir = path.join(__dirname, 'source', 'json');
const outputFile = path.join(outputDir, 'music.json');

// 默认封面图（当找不到对应封面时使用）
const DEFAULT_COVER = 'https://img02.anheyu.com/adminuploads/1/2022/09/26/6330e9bcc3955.jpg';

console.log('正在扫描音乐文件夹:', musicDir);

// 确保输出目录存在
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// 检查音乐目录是否存在
if (!fs.existsSync(musicDir)) {
    console.error(`错误: 找不到音乐目录 ${musicDir}`);
    process.exit(1);
}

// 读取目录文件
const files = fs.readdirSync(musicDir);
const musicList = [];

// 过滤 MP3 文件
const mp3Files = files.filter(file => path.extname(file).toLowerCase() === '.mp3');

console.log(`发现 ${mp3Files.length} 首歌曲...`);

mp3Files.forEach(mp3File => {
    const ext = path.extname(mp3File);
    const baseName = path.basename(mp3File, ext);
    
    // 解析文件名: 歌曲名 - 歌手.mp3
    // 如果没有横杠，则默认为: 歌曲名 (歌手: Unknown)
    let name = baseName;
    let artist = 'Unknown';
    
    if (baseName.includes('-')) {
        const parts = baseName.split('-');
        // 假设格式: 歌曲名 - 歌手
        // 取最后一部分作为歌手，前面的作为歌名（防止歌名中也有横杠）
        artist = parts[parts.length - 1].trim();
        name = parts.slice(0, parts.length - 1).join('-').trim();
    }

    // 查找封面文件 (支持 jpg, jpeg, png, webp)
    let cover = DEFAULT_COVER;
    const possibleCovers = ['.jpeg', '.jpg', '.png', '.webp'];
    for (const coverExt of possibleCovers) {
        if (files.includes(baseName + coverExt)) {
            cover = `/music/${baseName}${coverExt}`;
            break;
        }
    }

    // 查找歌词文件 (.lrc)
    let lrc = '';
    if (files.includes(baseName + '.lrc')) {
        lrc = `/music/${baseName}.lrc`;
    }

    // 添加到列表
    musicList.push({
        name: name,
        artist: artist,
        url: `/music/${mp3File}`,
        cover: cover,
        lrc: lrc
    });
    
    console.log(`+ 添加: ${name} - ${artist}`);
});

// 写入 JSON 文件
const jsonContent = JSON.stringify(musicList, null, 4);
fs.writeFileSync(outputFile, jsonContent);

console.log('-----------------------------------');
console.log(`成功生成音乐列表!`);
console.log(`文件已保存至: ${outputFile}`);
console.log(`共包含 ${musicList.length} 首歌曲。`);
