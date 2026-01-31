import React from 'react';

export default function Layout({ children, activeTab, setActiveTab }) {
  const tabs = [
    { id: 'dashboard', label: '仪表盘', icon: '📊' },
    { id: 'posts', label: '文章管理', icon: '📝' },
    { id: 'media', label: '媒体库', icon: '🖼️' },
    { id: 'config', label: '站点配置', icon: '⚙️' },
  ];

  return (
    <div className="flex h-screen bg-[#f7f9fe]">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-xl z-10 flex flex-col">
        <div className="p-6 border-b border-gray-100 flex items-center justify-center">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-teal-400">
            Hexo Admin
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-blue-500'
              }`}
            >
              <span className="mr-3 text-xl">{tab.icon}</span>
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <div className="text-xs text-center text-gray-400">
            &copy; 2025 AnZhiYu Blog
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
