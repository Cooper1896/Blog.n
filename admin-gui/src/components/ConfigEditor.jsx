import React, { useState, useEffect } from 'react';

export default function ConfigEditor() {
  const [config, setConfig] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/config');
      const data = await res.json();
      setConfig(data.content);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching config:', error);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('http://localhost:3001/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: config }),
      });
      alert('配置已保存！');
    } catch (error) {
      console.error('Error saving config:', error);
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-white">
        <h2 className="text-xl font-bold text-gray-800">站点配置 (_config.yml)</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-6 py-2 rounded-xl text-white font-medium shadow-lg shadow-blue-500/30 transition-all transform active:scale-95 ${
            saving
              ? 'bg-blue-400 cursor-wait'
              : 'bg-blue-500 hover:bg-blue-600 hover:-translate-y-0.5'
          }`}
        >
          {saving ? '保存中...' : '保存配置'}
        </button>
      </div>
      <div className="flex-1 relative">
        <textarea
          value={config}
          onChange={(e) => setConfig(e.target.value)}
          className="w-full h-full p-6 resize-none focus:outline-none font-mono text-sm text-gray-700 leading-relaxed bg-gray-50"
          spellCheck="false"
        />
      </div>
    </div>
  );
}
