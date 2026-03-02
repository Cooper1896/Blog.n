import React, { useState } from 'react';
import { useTheme } from '../App';

const NAV_ITEMS = [
  { id: 'dashboard', label: '仪表盘', shortcut: '1', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { id: 'posts', label: '文章管理', shortcut: '2', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z' },
  { id: 'essays', label: '随笔管理', shortcut: '3', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
  { id: 'media', label: '媒体库', shortcut: '4', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { id: 'music', label: '音乐管理', shortcut: '5', icon: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3' },
  { id: 'data', label: '数据管理', shortcut: '6', icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4' },
  { id: 'config', label: '站点配置', shortcut: '7', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

const Icon = ({ d, size = 5, stroke = true, className = '' }) => (
  <svg className={`w-${size} h-${size} shrink-0 ${className}`} fill={stroke ? 'none' : 'currentColor'} stroke={stroke ? 'currentColor' : 'none'} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d={d} />
  </svg>
);

function SidebarContent({ activeTab, setActiveTab, collapsed, setCollapsed, onNavClick, toggle, isDark }) {
  return (
    <div className="flex flex-col h-full bg-[#0f172a] text-slate-400">
      {/* Brand */}
      <div className={`flex items-center ${collapsed ? 'justify-center px-2' : 'px-5'} h-16 shrink-0`}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-base shadow-lg shadow-indigo-500/30 shrink-0">
          A
        </div>
        {!collapsed && (
          <div className="ml-3 min-w-0">
            <h1 className="text-sm font-bold text-white truncate">AnZhiYu</h1>
            <p className="text-[10px] text-slate-500 -mt-0.5">博客管理后台</p>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-slate-800" />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); if (onNavClick) onNavClick(); }}
              title={collapsed ? item.label : ''}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                active
                  ? 'bg-white/10 text-white'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-indigo-400" />
              )}
              <Icon d={item.icon} />
              {!collapsed && (
                <>
                  <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
                  <span className="text-[10px] text-slate-600 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                    Alt+{item.shortcut}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="px-3 pb-4 space-y-2 shrink-0">
        <div className="mx-1 border-t border-slate-800 mb-3" />

        {/* Theme Toggle */}
        <button
          onClick={toggle}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-all ${collapsed ? 'justify-center' : ''}`}
        >
          {isDark ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
          {!collapsed && <span className="text-sm">{isDark ? '浅色模式' : '深色模式'}</span>}
        </button>

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-500 hover:bg-white/5 hover:text-slate-300 transition-all ${collapsed ? 'justify-center' : ''}`}
        >
          <svg className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
          {!collapsed && <span className="text-xs">收起侧栏</span>}
        </button>

        {!collapsed && (
          <p className="text-[10px] text-center text-slate-700 mt-2 select-none">
            &copy; 2025 AnZhiYu Admin v2.0
          </p>
        )}
      </div>
    </div>
  );
}

export default function Layout({ children, activeTab, setActiveTab }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { toggle, isDark } = useTheme();

  return (
    <div className="flex h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar - Desktop */}
      <div className={`hidden lg:block ${collapsed ? 'w-[68px]' : 'w-[220px]'} shrink-0 transition-all duration-300 z-30`}>
        <SidebarContent activeTab={activeTab} setActiveTab={setActiveTab} collapsed={collapsed} setCollapsed={setCollapsed} toggle={toggle} isDark={isDark} />
      </div>

      {/* Sidebar - Mobile */}
      <div className={`fixed inset-y-0 left-0 w-[220px] z-50 lg:hidden transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent activeTab={activeTab} setActiveTab={setActiveTab} collapsed={false} setCollapsed={setCollapsed} onNavClick={() => setMobileOpen(false)} toggle={toggle} isDark={isDark} />
      </div>

      {/* Main */}
      <div className="flex-1 overflow-hidden flex flex-col min-w-0">
        {/* Top Bar */}
        <header
          className="h-14 shrink-0 flex items-center justify-between px-4 lg:px-6 border-b"
          style={{
            background: 'var(--bg-card)',
            backdropFilter: 'blur(16px)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-[var(--bg-hover)]"
              style={{ color: 'var(--text-secondary)' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                {NAV_ITEMS.find(n => n.id === activeTab)?.label || '仪表盘'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
              style={{
                color: 'var(--text-muted)',
                background: 'var(--bg-hover)',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              访问博客
            </a>
            <div
              className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold shadow-sm cursor-default select-none"
              title="Cooper Liu"
            >
              C
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6" style={{ background: 'var(--bg-base)' }}>
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
