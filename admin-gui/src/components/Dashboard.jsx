import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, formatWordCount, timeAgo } from '../utils/api';
import { useToast } from './Toast';

const StatCard = ({ label, value, icon, gradient, delay = 0 }) => (
  <div
    className="glass p-4 group cursor-default anim-fade-in"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div
      className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 shadow-sm transition-transform duration-300 group-hover:scale-110 bg-gradient-to-br ${gradient}`}
    >
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} />
      </svg>
    </div>
    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
  </div>
);

export default function Dashboard({ onNavigate, onEditPost }) {
  const [stats, setStats] = useState(null);
  const [systemInfo, setSystemInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [runningCmd, setRunningCmd] = useState(null);
  const [cmdOutput, setCmdOutput] = useState('');
  const [gitStatus, setGitStatus] = useState(null);
  const [showGitModal, setShowGitModal] = useState(false);
  const [commitMsg, setCommitMsg] = useState('');
  const [syncing, setSyncing] = useState(false);
  const toast = useToast();

  useEffect(() => {
    Promise.all([
      apiGet('/api/stats').then(setStats),
      apiGet('/api/system').then(setSystemInfo),
      apiGet('/api/git/status').then(setGitStatus).catch(() => {}),
    ]).catch(err => toast.error('加载失败: ' + err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runHexoCommand = async (cmd) => {
    setRunningCmd(cmd);
    setCmdOutput(`⏳ 正在执行 hexo ${cmd}...\n`);
    try {
      const data = await apiPost(`/api/hexo/${cmd}`, {});
      setCmdOutput(prev => prev + (data.output || '') + '\n✅ 完成!');
      toast.success(`hexo ${cmd} 执行成功`);
    } catch (error) {
      setCmdOutput(prev => prev + `\n❌ 错误: ${error.message}`);
      toast.error(`hexo ${cmd} 执行失败`);
    } finally { setRunningCmd(null); }
  };

  const fetchGitStatus = async () => {
    try { setGitStatus(await apiGet('/api/git/status')); } catch { /* ignore */ }
  };

  const handleGitSync = async () => {
    setSyncing(true);
    setCmdOutput('⏳ 正在同步到 GitHub...\n');
    try {
      const msg = commitMsg.trim() || `Blog update: ${new Date().toLocaleString('zh-CN')}`;
      const data = await apiPost('/api/git/sync', { message: msg });
      setCmdOutput(prev => prev + (data.output || '') + (data.warnings || '') + '\n✅ 同步成功!');
      toast.success('已同步到 GitHub');
      setShowGitModal(false);
      setCommitMsg('');
      fetchGitStatus();
    } catch (error) {
      setCmdOutput(prev => prev + `\n❌ 同步失败: ${error.message}`);
      toast.error('同步失败: ' + error.message);
    } finally { setSyncing(false); }
  };

  const handleGitPull = async () => {
    setRunningCmd('pull');
    setCmdOutput('⏳ 正在从远程拉取...\n');
    try {
      const data = await apiPost('/api/git/pull', {});
      setCmdOutput(prev => prev + (data.output || '') + '\n✅ 拉取完成!');
      toast.success('拉取成功');
      fetchGitStatus();
    } catch (error) {
      setCmdOutput(prev => prev + `\n❌ 拉取失败: ${error.message}`);
      toast.error('拉取失败');
    } finally { setRunningCmd(null); }
  };

  // Time-based greeting
  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 6) return '🌙 夜深了，注意休息';
    if (h < 12) return '☀️ 早上好';
    if (h < 14) return '🌤 中午好';
    if (h < 18) return '🌇 下午好';
    return '🌆 晚上好';
  };

  if (loading) return (
    <div className="space-y-6">
      <div className="skeleton h-36 rounded-2xl" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
      </div>
    </div>
  );

  const statCards = [
    { label: '文章', value: stats?.posts || 0, gradient: 'from-blue-500 to-blue-600', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z' },
    { label: '标签', value: stats?.tags || 0, gradient: 'from-violet-500 to-purple-600', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
    { label: '分类', value: stats?.categories || 0, gradient: 'from-pink-500 to-rose-500', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { label: '随笔', value: stats?.essays || 0, gradient: 'from-amber-500 to-orange-500', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
    { label: '图片', value: stats?.images || 0, gradient: 'from-emerald-500 to-teal-500', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { label: '总字数', value: formatWordCount(stats?.totalWords || 0), gradient: 'from-cyan-500 to-sky-500', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  ];

  const quickActions = [
    { label: '新建文章', icon: 'M12 4v16m8-8H4', action: () => onNavigate('posts'), color: 'from-blue-500/10 to-blue-600/10', text: 'text-blue-500' },
    { label: '清理缓存', icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16', action: () => runHexoCommand('clean'), color: 'from-slate-500/10 to-slate-600/10', text: 'text-slate-500' },
    { label: '生成站点', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15', action: () => runHexoCommand('generate'), color: 'from-emerald-500/10 to-emerald-600/10', text: 'text-emerald-500' },
    { label: '一键部署', icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12', action: () => runHexoCommand('deploy'), color: 'from-violet-500/10 to-violet-600/10', text: 'text-violet-500' },
    { label: '同步 Git', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4', action: () => { fetchGitStatus(); setShowGitModal(true); }, color: 'from-gray-500/10 to-gray-600/10', text: 'text-gray-600' },
    { label: '远程拉取', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4', action: () => handleGitPull(), color: 'from-indigo-500/10 to-indigo-600/10', text: 'text-indigo-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 p-6 lg:p-8 text-white anim-fade-in">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-purple-400/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />
        <div className="relative z-10">
          <p className="text-indigo-200 text-sm mb-1">{getGreeting()}，Cooper</p>
          <h1 className="text-2xl lg:text-3xl font-bold mb-1">AnZhiYu 博客管理</h1>
          <p className="text-indigo-200/80 text-sm">准备好写新文章了吗？今天也是充满灵感的一天 ✨</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 stagger">
        {statCards.map((card, i) => (
          <StatCard key={card.label} {...card} delay={i * 50} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Posts */}
        <div className="lg:col-span-2 glass overflow-hidden anim-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>最近文章</h3>
            <button onClick={() => onNavigate('posts')} className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
              查看全部 →
            </button>
          </div>
          <div>
            {(stats?.recentPosts || []).map((post, idx) => (
              <div
                key={post.filename}
                className="flex items-center justify-between px-5 py-3.5 transition-colors cursor-pointer"
                style={{ borderBottom: idx < (stats?.recentPosts?.length || 0) - 1 ? '1px solid var(--border)' : 'none' }}
                onClick={() => onEditPost(post.filename)}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{post.title}</h4>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{timeAgo(post.date)}</p>
                </div>
                <div className="flex gap-1.5 ml-3">
                  {post.categories && (Array.isArray(post.categories) ? post.categories : [post.categories]).slice(0, 1).map(cat => (
                    <span key={cat} className="badge badge-accent">{cat}</span>
                  ))}
                </div>
              </div>
            ))}
            {(!stats?.recentPosts || stats.recentPosts.length === 0) && (
              <div className="text-center py-10 text-sm" style={{ color: 'var(--text-muted)' }}>暂无文章</div>
            )}
          </div>
        </div>

        {/* Quick Actions & System Info */}
        <div className="space-y-6">
          <div className="glass p-5 anim-fade-in" style={{ animationDelay: '150ms' }}>
            <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>快捷操作</h3>
            <div className="grid grid-cols-3 gap-2.5">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={action.action}
                  disabled={!!runningCmd || syncing}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all bg-gradient-to-br ${action.color} ${action.text} ${(runningCmd || syncing) ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={action.icon} />
                  </svg>
                  <span className="text-[11px] font-medium leading-tight">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {systemInfo && (
            <div className="glass p-5 anim-fade-in" style={{ animationDelay: '200ms' }}>
              <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>系统信息</h3>
              <div className="space-y-2.5 text-sm">
                {[
                  ['主题', `${systemInfo.themeName} v${systemInfo.themeVersion}`],
                  ['Hexo', systemInfo.hexoVersion],
                  ['Node.js', systemInfo.nodeVersion],
                  ['平台', systemInfo.platform],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                    <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Git Status */}
      {gitStatus && (
        <div className="glass p-5 anim-fade-in" style={{ animationDelay: '250ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836a9.59 9.59 0 012.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              Git 仓库
            </h3>
            <button onClick={fetchGitStatus} className="text-xs btn-ghost px-2 py-1 rounded-lg" style={{ color: 'var(--text-muted)' }}>刷新</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl" style={{ background: 'var(--bg-hover)' }}>
              <p className="text-[10px] mb-0.5" style={{ color: 'var(--text-muted)' }}>分支</p>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{gitStatus.branch}</p>
            </div>
            <div className="p-3 rounded-xl" style={{ background: 'var(--bg-hover)' }}>
              <p className="text-[10px] mb-0.5" style={{ color: 'var(--text-muted)' }}>状态</p>
              <p className={`text-sm font-semibold ${gitStatus.clean ? 'text-emerald-500' : 'text-amber-500'}`}>
                {gitStatus.clean ? '✅ 已同步' : `⚠ ${gitStatus.changedCount} 个更改`}
              </p>
            </div>
            <div className="p-3 rounded-xl" style={{ background: 'var(--bg-hover)' }}>
              <p className="text-[10px] mb-0.5" style={{ color: 'var(--text-muted)' }}>远程仓库</p>
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-secondary)' }}>
                {gitStatus.remoteUrl ? gitStatus.remoteUrl.replace(/.*github\.com[:/]/, '').replace(/\.git$/, '') : '未配置'}
              </p>
            </div>
            <div className="flex items-center justify-center">
              <button
                onClick={() => { setShowGitModal(true); }}
                disabled={gitStatus.clean || syncing}
                className={`btn text-sm ${gitStatus.clean ? 'btn-ghost opacity-50 cursor-not-allowed' : 'btn-primary'}`}
              >
                {syncing ? '同步中...' : '立即同步'}
              </button>
            </div>
          </div>
          {!gitStatus.clean && gitStatus.changes?.length > 0 && (
            <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
              <div className="flex flex-wrap gap-1.5 max-h-20 overflow-auto">
                {gitStatus.changes.slice(0, 15).map((change, i) => (
                  <span key={i} className={`badge ${change.status === 'M' ? 'badge-warning' : change.status === 'D' ? 'badge-danger' : 'badge-success'}`}>
                    {change.status === 'M' ? '修改' : change.status === 'D' ? '删除' : '新增'} {change.file.split('/').pop()}
                  </span>
                ))}
                {gitStatus.changes.length > 15 && (
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>...还有 {gitStatus.changes.length - 15} 个文件</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Git Sync Modal */}
      {showGitModal && (
        <div className="modal-backdrop" onClick={() => !syncing && setShowGitModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836a9.59 9.59 0 012.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>同步到 GitHub</h3>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {gitStatus?.remoteUrl ? gitStatus.remoteUrl.replace(/.*github\.com[:/]/, '').replace(/\.git$/, '') : '远程仓库'}
                </p>
              </div>
            </div>

            {gitStatus && !gitStatus.clean && (
              <div className="rounded-xl p-3 mb-4" style={{ background: 'var(--bg-hover)' }}>
                <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>📋 将提交 {gitStatus.changedCount} 个更改</p>
                <div className="max-h-32 overflow-auto space-y-1">
                  {gitStatus.changes.map((change, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className={`badge ${change.status === 'M' ? 'badge-warning' : change.status === 'D' ? 'badge-danger' : 'badge-success'}`}>
                        {change.status === 'M' ? 'M' : change.status === 'D' ? 'D' : 'A'}
                      </span>
                      <span className="truncate" style={{ color: 'var(--text-secondary)' }}>{change.file}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>提交信息</label>
              <input
                type="text"
                value={commitMsg}
                onChange={e => setCommitMsg(e.target.value)}
                placeholder={`Blog update: ${new Date().toLocaleString('zh-CN')}`}
                className="input"
                onKeyDown={e => e.key === 'Enter' && !syncing && handleGitSync()}
                autoFocus
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button onClick={() => { setShowGitModal(false); setCommitMsg(''); }} disabled={syncing} className="btn btn-ghost">取消</button>
              <button onClick={handleGitSync} disabled={syncing} className="btn btn-primary">
                {syncing ? (
                  <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> 同步中...</>
                ) : '确认同步'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terminal Output */}
      {cmdOutput && (
        <div className="rounded-2xl p-4 font-mono text-xs max-h-48 overflow-auto whitespace-pre-wrap anim-fade-in" style={{ background: 'var(--bg-terminal)', color: '#94a3b8' }}>
          <div className="flex items-center gap-2 mb-2" style={{ color: '#475569' }}>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
            </div>
            <span className="text-[10px]">Terminal</span>
            <button onClick={() => setCmdOutput('')} className="ml-auto hover:text-slate-300 transition-colors">✕</button>
          </div>
          {cmdOutput}
        </div>
      )}
    </div>
  );
}
