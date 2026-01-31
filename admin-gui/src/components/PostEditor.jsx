import React, { useState, useEffect } from 'react';

export default function PostEditor({ filename, onBack }) {
  const [content, setContent] = useState('');
  const [metadata, setMetadata] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('content'); // 'content' or 'settings'

  useEffect(() => {
    fetchPost();
  }, [filename]);

  const fetchPost = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/posts/${filename}`);
      const data = await res.json();
      // If backend returns parsed data (new API), use it. 
      // Fallback for old API (just content string)
      if (data.data) {
        setContent(data.content);
        setMetadata(data.data);
      } else {
        setContent(data.content);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching post:', error);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`http://localhost:3001/api/posts/${filename}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content, 
          data: metadata 
        }),
      });
      alert('保存成功！');
    } catch (error) {
      console.error('Error saving post:', error);
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleMetadataChange = (key, value) => {
    setMetadata(prev => ({ ...prev, [key]: value }));
  };

  if (loading) return (
    <div className="flex justify-center items-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            &larr;
          </button>
          <h2 className="text-xl font-bold text-gray-800 truncate max-w-md">{metadata.title || filename}</h2>
          
          <div className="flex bg-gray-100 rounded-lg p-1 ml-4">
            <button
              onClick={() => setActiveTab('content')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'content' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              内容编辑
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'settings' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              文章设置
            </button>
          </div>
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-6 py-2 rounded-xl text-white font-medium shadow-lg shadow-blue-500/30 transition-all transform active:scale-95 ${
            saving ? 'bg-blue-400 cursor-wait' : 'bg-blue-500 hover:bg-blue-600 hover:-translate-y-0.5'
          }`}
        >
          {saving ? '保存中...' : '保存文章'}
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'content' ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full p-8 resize-none focus:outline-none font-mono text-gray-700 leading-relaxed"
            placeholder="开始写作..."
            spellCheck="false"
          />
        ) : (
          <div className="p-8 max-w-3xl mx-auto overflow-y-auto h-full">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">文章标题</label>
                <input
                  type="text"
                  value={metadata.title || ''}
                  onChange={(e) => handleMetadataChange('title', e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">发布日期</label>
                  <input
                    type="datetime-local"
                    value={metadata.date ? new Date(metadata.date).toISOString().slice(0, 16) : ''}
                    onChange={(e) => handleMetadataChange('date', e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">永久链接 (Permalink)</label>
                  <input
                    type="text"
                    value={metadata.abbrlink || ''}
                    onChange={(e) => handleMetadataChange('abbrlink', e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="可选"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">封面图片 URL</label>
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={metadata.cover || metadata.top_img || ''}
                    onChange={(e) => {
                      handleMetadataChange('cover', e.target.value);
                      handleMetadataChange('top_img', e.target.value);
                    }}
                    className="flex-1 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="https://..."
                  />
                  {metadata.cover && (
                    <div className="w-24 h-12 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                      <img src={metadata.cover} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">标签 (Tags)</label>
                <input
                  type="text"
                  value={Array.isArray(metadata.tags) ? metadata.tags.join(', ') : metadata.tags || ''}
                  onChange={(e) => handleMetadataChange('tags', e.target.value.split(',').map(t => t.trim()))}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Tag1, Tag2, Tag3"
                />
                <p className="text-xs text-gray-400 mt-1">使用逗号分隔多个标签</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">分类 (Categories)</label>
                <input
                  type="text"
                  value={Array.isArray(metadata.categories) ? metadata.categories.join(', ') : metadata.categories || ''}
                  onChange={(e) => handleMetadataChange('categories', e.target.value.split(',').map(t => t.trim()))}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Category1, Category2"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
