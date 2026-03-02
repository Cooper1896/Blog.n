import React, { useState, useEffect, useRef } from 'react';
import { apiGet, apiPost } from '../utils/api';
import { useToast } from './Toast';

export default function ConfigEditor() {
  const [configs, setConfigs] = useState({});
  const [activeFile, setActiveFile] = useState('site');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [lineCount, setLineCount] = useState(0);
  const textareaRef = useRef(null);
  const lineNumRef = useRef(null);
  const toast = useToast();

  const configFiles = [
    { key: 'site', label: '站点配置', icon: '🌐', desc: '_config.yml', color: 'var(--accent)' },
    { key: 'theme', label: '主题配置', icon: '🎨', desc: 'themes/anzhiyu/_config.yml', color: '#10b981' },
  ];

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchConfigs(); }, []);

  useEffect(() => {
    const c = configs[activeFile] || '';
    setContent(c);
    setLineCount(c.split('\n').length);
    setDirty(false);
  }, [activeFile, configs]);

  const fetchConfigs = async () => {
    try {
      const data = await apiGet('/api/config');
      setConfigs({ site: data.configRaw || '', theme: data.themeConfigRaw || '' });
    } catch { toast.error('加载配置失败'); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiPost('/api/config', { type: activeFile, content });
      setConfigs(prev => ({ ...prev, [activeFile]: content }));
      toast.success('配置已保存');
      setDirty(false);
    } catch { toast.error('保存失败'); }
    finally { setSaving(false); }
  };

  const handleChange = (val) => {
    setContent(val);
    setLineCount(val.split('\n').length);
    setDirty(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === 's' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleSave(); return; }
    if (e.key === 'Tab') {
      e.preventDefault();
      const { selectionStart, selectionEnd } = e.target;
      const newVal = content.substring(0, selectionStart) + '  ' + content.substring(selectionEnd);
      handleChange(newVal);
      requestAnimationFrame(() => {
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = selectionStart + 2;
      });
    }
  };

  const syncScroll = () => {
    if (lineNumRef.current && textareaRef.current) {
      lineNumRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  if (loading) return (
    <div className="space-y-4">
      <div className="skeleton h-12 rounded-xl" />
      <div className="skeleton h-[70vh] rounded-xl" />
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>站点配置</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>编辑 YAML 配置文件</p>
        </div>
        <div className="flex gap-2 items-center">
          {dirty && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">未保存</span>}
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{lineCount} 行</span>
          <button onClick={handleSave} disabled={saving || !dirty} className="btn btn-primary text-sm">
            {saving ? '保存中...' : '💾 保存 (Ctrl+S)'}
          </button>
        </div>
      </div>

      {/* File Tabs */}
      <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
        {configFiles.map(f => (
          <button
            key={f.key}
            onClick={() => activeFile !== f.key && (dirty ? confirm('未保存的更改将丢失，确定切换？') && setActiveFile(f.key) : setActiveFile(f.key))}
            className={`px-4 py-2.5 text-sm font-medium transition-all relative ${activeFile === f.key ? '' : 'opacity-60 hover:opacity-90'}`}
            style={{ color: activeFile === f.key ? f.color : 'var(--text-secondary)' }}
          >
            <span className="flex items-center gap-1.5">{f.icon} {f.label}</span>
            {activeFile === f.key && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: f.color }} />
            )}
          </button>
        ))}
      </div>

      {/* Editor */}
      <div className="glass overflow-hidden rounded-xl">
        {/* Info Bar */}
        <div className="px-4 py-2 flex items-center justify-between text-xs" style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
          <span>{configFiles.find(f => f.key === activeFile)?.desc}</span>
          <span>YAML</span>
        </div>

        {/* Code Area */}
        <div className="flex relative" style={{ height: '65vh' }}>
          {/* Line Numbers */}
          <div
            ref={lineNumRef}
            className="select-none text-right py-3 px-3 text-xs font-mono overflow-hidden shrink-0"
            style={{ color: 'var(--text-muted)', background: 'var(--bg-secondary)', width: '3.5rem', lineHeight: '1.7' }}
          >
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={e => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onScroll={syncScroll}
            className="w-full h-full resize-none outline-none p-3 text-sm editor-textarea"
            style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', lineHeight: '1.7', tabSize: 2 }}
            spellCheck={false}
          />
        </div>
      </div>

      {/* Tips */}
      <div className="flex flex-wrap gap-3 text-[10px]" style={{ color: 'var(--text-muted)' }}>
        <span>💡 Ctrl + S 快速保存</span>
        <span>📐 Tab 键插入缩进</span>
        <span>⚠️ 修改配置后需要重新生成站点</span>
      </div>
    </div>
  );
}
