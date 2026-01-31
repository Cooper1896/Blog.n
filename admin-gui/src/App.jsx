import React, { useState } from 'react';
import Layout from './components/Layout';
import PostList from './components/PostList';
import PostEditor from './components/PostEditor';
import ConfigEditor from './components/ConfigEditor';
import Dashboard from './components/Dashboard';
import MediaManager from './components/MediaManager';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [editingPost, setEditingPost] = useState(null);

  const renderContent = () => {
    if (activeTab === 'dashboard') {
      return <Dashboard onNavigate={setActiveTab} />;
    }
    if (activeTab === 'media') {
      return <MediaManager />;
    }
    if (activeTab === 'posts') {
      if (editingPost) {
        return (
          <PostEditor
            filename={editingPost}
            onBack={() => setEditingPost(null)}
          />
        );
      }
      return <PostList onEdit={setEditingPost} />;
    }
    if (activeTab === 'config') {
      return <ConfigEditor />;
    }
    return <div>Select a tab</div>;
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={(tab) => {
      setActiveTab(tab);
      setEditingPost(null);
    }}>
      {renderContent()}
    </Layout>
  );
}

export default App;
