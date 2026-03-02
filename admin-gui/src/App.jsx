import React, { useState, useEffect, createContext, useContext } from 'react';
import { ToastProvider } from './components/Toast';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import PostList from './components/PostList';
import PostEditor from './components/PostEditor';
import EssayManager from './components/EssayManager';
import MediaManager from './components/MediaManager';
import MusicManager from './components/MusicManager';
import DataManager from './components/DataManager';
import ConfigEditor from './components/ConfigEditor';
import './App.css';

// ===== Theme Context =====
const ThemeContext = createContext();

export function useTheme() {
  return useContext(ThemeContext);
}

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('admin-theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('admin-theme', theme);
  }, [theme]);

  const toggle = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ theme, toggle, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ===== App Content =====
function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [editingPost, setEditingPost] = useState(null);

  const handleNavigate = (tab) => {
    setActiveTab(tab);
    setEditingPost(null);
  };

  const handleEditPost = (filename) => {
    setActiveTab('posts');
    setEditingPost(filename);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const shortcuts = { '1': 'dashboard', '2': 'posts', '3': 'essays', '4': 'media', '5': 'music', '6': 'data', '7': 'config' };
        if (shortcuts[e.key]) {
          e.preventDefault();
          handleNavigate(shortcuts[e.key]);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} onEditPost={handleEditPost} />;
      case 'posts':
        return editingPost
          ? <PostEditor filename={editingPost} onBack={() => setEditingPost(null)} />
          : <PostList onEdit={setEditingPost} />;
      case 'essays':
        return <EssayManager />;
      case 'media':
        return <MediaManager />;
      case 'music':
        return <MusicManager />;
      case 'data':
        return <DataManager />;
      case 'config':
        return <ConfigEditor />;
      default:
        return <Dashboard onNavigate={handleNavigate} onEditPost={handleEditPost} />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={handleNavigate}>
      {renderContent()}
    </Layout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ThemeProvider>
  );
}
