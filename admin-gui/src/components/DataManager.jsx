import React, { useState, useEffect, useRef } from 'react';
import { apiGet, apiPost } from '../utils/api';
import { useToast } from './Toast';

export default function DataManager() {
  const [files, setFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [lineCount, setLineCount] = useState(0);
  const textareaRef = useRef(null);
  const lineNumRef = useRef(null);
  const toast = useToast();

  const fileIcons = { 'essay.yml': '💬', 'equipment.yml': '🖥️', 'creativity.yml': '💡' };
  const fileDescriptions = { 'essay.yml': '随笔数据', 'equipment.yml': '装备展示', 'creativity.yml': '创意数据' };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchFiles(); }, []);

  useEffect(() => {
    if (activeFile) fetchFileContent(activeFile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFile]);

  const fetchFiles = async () => {
    try {
      const data = await apiGet('/api/data');
      setFiles(data || []);
      if (data?.length > 0 && !activeFile) setActiveFile(data[0].filename);
    } catch { toast.error('加载数据文件列表失败'); }
    finally { setLoading(false); }
  };

  const fetchFileContent = async (filename) => {
    try {
      const data = await apiGet(`/api/data/${encodeURIComponent(filename)}`);
      const c = data.content || '';
      setContent(c);
      setLineCount(c.split('\n').length);
      setDirty(false);
    } catch { toast.error('加载文件内容失败'); }
  };

  const handleSave = async () => {
    if (!activeFile) return;
    setSaving(true);
    try {
      await apiPost(`/api/data/${encodeURIComponent(activeFile)}`, { content });
      toast.success(`${activeFile} 已保存`);
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
    if (e.key === 's' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleSave(); }
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

  const switchFile = (name) => {
    if (name === activeFile) return;
    if (dirty && !confirm('未保存的更改将丢失，确定切换？')) return;
    setActiveFile(name);
  };

  if (loading) return (
    <div className="space-y-4">
      <div className="skeleton h-12 rounded-xl" />
      <div className="flex gap-4">
        <div className="skeleton h-[60vh] w-52 rounded-xl" />
        <div className="skeleton h-[60vh] flex-1 rounded-xl" />
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>数据管理</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>编辑 source/_data/ 目录下的 YAML 文件</p>
        </div>
        {activeFile && (
          <div className="flex items-center gap-2">
            {dirty && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">未保存</span>}
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{lineCount} 行</span>
            <button onClick={handleSave} disabled={saving || !dirty} className="btn btn-primary text-sm">
              {saving ? '保存中...' : '💾 保存'}
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-4" style={{ minHeight: '65vh' }}>
        {/* File List Sidebar */}
        <div className="w-52 shrink-0 glass p-3 rounded-xl space-y-1.5">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider mb-2 px-2" style={{ color: 'var(--text-muted)' }}>文件列表</h4>
          {files.map(f => (
            <button
              key={f.filename}
              onClick={() => switchFile(f.filename)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center gap-2 ${activeFile === f.filename ? '' : 'opacity-70 hover:opacity-100'}`}
              style={{
                background: activeFile === f.filename ? 'var(--accent-bg)' : 'transparent',
                color: activeFile === f.filename ? 'var(--accent)' : 'var(--text-secondary)',
                fontWeight: activeFile === f.filename ? 600 : 400,
              }}
            >
              <span>{fileIcons[f.filename] || '📄'}</span>
              <div className="min-w-0">
                <div className="truncate text-sm">{f.filename}</div>
                <div className="text-[10px] opacity-60">{fileDescriptions[f.filename] || 'YAML 数据'}</div>
              </div>
              {activeFile === f.filename && dirty && (
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 ml-auto" />
              )}
            </button>
          ))}
        </div>

        {/* Editor Area */}
        {activeFile ? (
          <div className="flex-1 glass overflow-hidden rounded-xl">
            {/* File info bar */}
            <div className="px-4 py-2 flex items-center justify-between text-xs" style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              <span className="flex items-center gap-1.5">
                {fileIcons[activeFile] || '📄'} {activeFile}
                {dirty && <span className="ml-1 text-amber-500">(已修改)</span>}
              </span>
              <span>YAML · Ctrl+S 保存</span>
            </div>

            {/* Code Editor */}
            <div className="flex relative" style={{ height: 'calc(65vh - 2.5rem)' }}>
              {/* Line Numbers */}
              <div
                ref={lineNumRef}
                className="select-none text-right py-3 px-3 text-xs font-mono overflow-hidden shrink-0"
                style={{ color: 'var(--text-muted)', background: 'var(--bg-secondary)', width: '3.5rem', lineHeight: '1.7' }}
              >
                {Array.from({ length: lineCount }, (_, i) => (<div key={i}>{i + 1}</div>))}
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
        ) : (
          <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
            <p className="text-sm">从左侧选择一个文件开始编辑</p>
          </div>
        )}
      </div>
    </div>
  );
}
