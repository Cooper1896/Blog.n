import React, { useState, useEffect } from 'react';

export default function Dashboard({ onNavigate }) {
  const [stats, setStats] = useState({ posts: 0, tags: 0, categories: 0, comments: 0 });
  const [loading, setLoading] = useState(true);
  const [runningCmd, setRunningCmd] = useState(null);
  const [cmdOutput, setCmdOutput] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/stats');
      const data = await res.json();
      setStats(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  };

  const runHexoCommand = async (cmd) => {
    setRunningCmd(cmd);
    setCmdOutput(`Executing hexo ${cmd}...\n`);
    try {
      const res = await fetch(`http://localhost:3001/api/hexo/${cmd}`, { method: 'POST' });
      const data = await res.json();
      if (data.error) {
        setCmdOutput(prev => prev + `Error: ${data.error}\n${data.details}`);
      } else {
        setCmdOutput(prev => prev + data.output + '\nDone!');
      }
    } catch (error) {
      setCmdOutput(prev => prev + `Request failed: ${error.message}`);
    } finally {
      setRunningCmd(null);
    }
  };

  const StatCard = ({ title, value, icon, color }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`p-4 rounded-xl ${color} text-white`}>
        {icon}
      </div>
      <div>
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-gray-800">{loading ? '-' : value}</h3>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-3xl p-8 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">欢迎回来, Admin!</h1>
          <p className="text-blue-100">准备好分享新的故事了吗？</p>
          <button 
            onClick={() => onNavigate('posts')}
            className="mt-6 px-6 py-2 bg-white text-blue-600 rounded-xl font-medium hover:bg-blue-50 transition-colors shadow-sm"
          >
            写文章 &rarr;
          </button>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-10 translate-y-10">
          <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z" clipRule="evenodd" /></svg>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="文章总数" 
          value={stats.posts} 
          color="bg-blue-500"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>}
        />
        <StatCard 
          title="标签" 
          value={stats.tags} 
          color="bg-purple-500"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>}
        />
        <StatCard 
          title="分类" 
          value={stats.categories} 
          color="bg-pink-500"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
        />
        <StatCard 
          title="评论" 
          value={stats.comments} 
          color="bg-green-500"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">快捷操作</h2>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={() => runHexoCommand('clean')}
            disabled={runningCmd}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            清理缓存 (Clean)
          </button>
          <button 
            onClick={() => runHexoCommand('generate')}
            disabled={runningCmd}
            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            生成静态文件 (Generate)
          </button>
          <button 
            onClick={() => runHexoCommand('deploy')}
            disabled={runningCmd}
            className="px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            一键部署 (Deploy)
          </button>
        </div>
        
        {/* Console Output */}
        {cmdOutput && (
          <div className="mt-6 bg-gray-900 rounded-xl p-4 font-mono text-sm text-gray-300 overflow-x-auto max-h-64 whitespace-pre-wrap">
            {cmdOutput}
          </div>
        )}
      </div>
    </div>
  );
}
