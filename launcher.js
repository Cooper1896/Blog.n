const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

// 获取 exe 所在目录（pkg 打包后 process.execPath 是 exe 路径）
const rootDir = path.dirname(process.execPath);
const adminDir = path.join(rootDir, 'admin-gui');

console.log('========================================');
console.log('  Hexo Admin GUI Launcher');
console.log('========================================');
console.log('');
console.log(`Working directory: ${rootDir}`);
console.log(`Admin GUI directory: ${adminDir}`);
console.log('');

const isWindows = os.platform() === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

// 启动后端服务
console.log('[Backend] Starting backend server...');
const backend = spawn(npmCmd, ['start'], {
  cwd: adminDir,
  stdio: 'pipe',
  shell: true,
  detached: false
});

backend.stdout.on('data', (data) => {
  process.stdout.write(`[Backend] ${data}`);
});

backend.stderr.on('data', (data) => {
  process.stderr.write(`[Backend Error] ${data}`);
});

backend.on('error', (err) => {
  console.error(`[Backend] Failed to start: ${err.message}`);
});

backend.on('close', (code) => {
  console.log(`[Backend] Process exited with code ${code}`);
});

// 启动前端服务
console.log('[Frontend] Starting frontend dev server...');
const frontend = spawn(npmCmd, ['run', 'dev'], {
  cwd: adminDir,
  stdio: 'pipe',
  shell: true,
  detached: false
});

frontend.stdout.on('data', (data) => {
  process.stdout.write(`[Frontend] ${data}`);
});

frontend.stderr.on('data', (data) => {
  process.stderr.write(`[Frontend Error] ${data}`);
});

frontend.on('error', (err) => {
  console.error(`[Frontend] Failed to start: ${err.message}`);
});

frontend.on('close', (code) => {
  console.log(`[Frontend] Process exited with code ${code}`);
});

console.log('');
console.log('Services starting...');
console.log('Backend will run on:  http://localhost:3001');
console.log('Frontend will run on: http://localhost:5175');
console.log('');
console.log('Press Ctrl+C to stop all services.');
console.log('');

// 捕获退出信号，清理子进程
function cleanup() {
  console.log('\nShutting down services...');
  if (!backend.killed) {
    if (isWindows) {
      spawn('taskkill', ['/pid', backend.pid, '/f', '/t'], { shell: true });
    } else {
      backend.kill('SIGTERM');
    }
  }
  if (!frontend.killed) {
    if (isWindows) {
      spawn('taskkill', ['/pid', frontend.pid, '/f', '/t'], { shell: true });
    } else {
      frontend.kill('SIGTERM');
    }
  }
  setTimeout(() => process.exit(0), 1000);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

// 保持进程运行
setInterval(() => {}, 1000 * 60 * 60);
