import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiGet, apiPost, readingTime } from '../utils/api';
import { useToast } from './Toast';

export default function PostEditor({ filename, onBack }) {
  const [content, setContent] = useState('');
  const [metadata, setMetadata] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activePanel, setActivePanel] = useState('edit');
  const [showPreview, setShowPreview] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [dirty, setDirty] = useState(false);
  const textareaRef = useRef(null);
  const autoSaveTimer = useRef(null);
  const toast = useToast();

  useEffect(() => {
    apiGet(`/api/posts/${encodeURIComponent(filename)}`)
      .then(data => {
        setContent(data.content || '');
        setMetadata(data.data || {});
      })
      .catch(() => toast.error('加载失败'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filename]);

  // Auto-save (debounced, 30s)
  useEffect(() => {
    if (!dirty) return;
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      doSave(true);
    }, 30000);
    return () => clearTimeout(autoSaveTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, metadata, dirty]);

  const doSave = useCallback(async (isAuto = false) => {
    setSaving(true);
    try {
      await apiPost(`/api/posts/${encodeURIComponent(filename)}`, { content, data: metadata });
      setLastSaved(new Date());
      setDirty(false);
      if (!isAuto) toast.success('保存成功！');
    } catch { toast.error('保存失败'); }
    finally { setSaving(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, metadata, filename]);

  const handleContentChange = (val) => { setContent(val); setDirty(true); };
  const handleMetaChange = (key, value) => { setMetadata(prev => ({ ...prev, [key]: value })); setDirty(true); };

  const insertText = (before, after = '') => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart, end = ta.selectionEnd;
    const selected = content.substring(start, end);
    const newContent = content.substring(0, start) + before + selected + after + content.substring(end);
    handleContentChange(newContent);
    setTimeout(() => { ta.focus(); ta.setSelectionRange(start + before.length, start + before.length + selected.length); }, 0);
  };

  // Image paste support
  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        const formData = new FormData();
        formData.append('file', file);
        toast.info('正在上传粘贴的图片...');
        fetch('/api/upload', { method: 'POST', body: formData })
          .then(r => r.json())
          .then(data => {
            if (data.url) insertText(`![image](${data.url})`);
            toast.success('图片已插入');
          })
          .catch(() => toast.error('图片上传失败'));
        break;
      }
    }
  };

  const toolbarActions = [
    { icon: 'B', title: '粗体 (Ctrl+B)', action: () => insertText('**', '**'), bold: true },
    { icon: 'I', title: '斜体', action: () => insertText('*', '*'), italic: true },
    { icon: 'S', title: '删除线', action: () => insertText('~~', '~~'), strike: true },
    { sep: true },
    { icon: 'H1', title: '标题', action: () => insertText('## ') },
    { icon: '│', title: '引用', action: () => insertText('> ') },
    { icon: '—', title: '分割线', action: () => insertText('\n---\n') },
    { sep: true },
    { icon: '•', title: '无序列表', action: () => insertText('- ') },
    { icon: '1.', title: '有序列表', action: () => insertText('1. ') },
    { icon: '☑', title: '待办', action: () => insertText('- [ ] ') },
    { sep: true },
    { icon: '<>', title: '行内代码', action: () => insertText('`', '`') },
    { icon: '{ }', title: '代码块', action: () => insertText('```\n', '\n```') },
    { icon: '🔗', title: '链接', action: () => insertText('[', '](url)') },
    { icon: '🖼', title: '图片', action: () => insertText('![alt](', ')') },
    { icon: '📊', title: '表格', action: () => insertText('| 列1 | 列2 | 列3 |\n| --- | --- | --- |\n| ', ' |  |  |\n') },
  ];

  const renderMarkdown = (md) => {
    if (!md) return '<p style="color:var(--text-muted)">预览区域</p>';
    return md
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/~~(.*?)~~/gim, '<del>$1</del>')
      .replace(/`([^`]+)`/gim, '<code>$1</code>')
      .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
      .replace(/^---$/gim, '<hr />')
      .replace(/!\[(.*?)\]\((.*?)\)/gim, '<img src="$2" alt="$1" />')
      .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2">$1</a>')
      .replace(/^- \[x\] (.*$)/gim, '<li>✅ $1</li>')
      .replace(/^- \[ \] (.*$)/gim, '<li>⬜ $1</li>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/\n/g, '<br />');
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); doSave(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') { e.preventDefault(); insertText('**', '**'); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') { e.preventDefault(); insertText('*', '*'); }
    // Tab support
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = textareaRef.current;
      const start = ta.selectionStart;
      handleContentChange(content.substring(0, start) + '  ' + content.substring(ta.selectionEnd));
      setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + 2; }, 0);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-96">
      <div className="w-10 h-10 border-3 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const wordCount = content.length;

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col glass overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onBack} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{metadata.title || filename}</h2>
            <div className="flex items-center gap-2 text-[10px]" style={{ color: 'var(--text-muted)' }}>
              {dirty && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />未保存</span>}
              {lastSaved && !dirty && <span>已保存 {lastSaved.toLocaleTimeString('zh-CN')}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex p-0.5 rounded-lg" style={{ background: 'var(--bg-hover)' }}>
            {[{ id: 'edit', label: '编辑' }, { id: 'preview', label: '预览' }, { id: 'settings', label: '设置' }].map(tab => (
              <button key={tab.id} onClick={() => setActivePanel(tab.id)}
                className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                style={{ background: activePanel === tab.id ? 'var(--bg-card-solid)' : 'transparent', color: activePanel === tab.id ? 'var(--accent)' : 'var(--text-muted)', boxShadow: activePanel === tab.id ? 'var(--shadow-xs)' : 'none' }}>
                {tab.label}
              </button>
            ))}
          </div>
          <button onClick={() => doSave()} disabled={saving} className="btn btn-primary text-sm">
            {saving ? '保存中...' : '💾 保存'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {activePanel === 'edit' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center gap-0.5 px-3 py-2 border-b shrink-0 overflow-x-auto" style={{ borderColor: 'var(--border)', background: 'var(--bg-hover)' }}>
              {toolbarActions.map((tool, i) => tool.sep ? (
                <div key={i} className="w-px h-5 mx-1" style={{ background: 'var(--border-strong)' }} />
              ) : (
                <button key={i} onClick={tool.action} title={tool.title}
                  className="px-2 py-1 text-xs rounded-md transition-colors shrink-0 font-mono"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card-solid)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
                  <span style={{ fontWeight: tool.bold ? 700 : 400, fontStyle: tool.italic ? 'italic' : 'normal', textDecoration: tool.strike ? 'line-through' : 'none' }}>{tool.icon}</span>
                </button>
              ))}
            </div>
            <div className="flex-1 flex overflow-hidden">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={e => handleContentChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                className={`${showPreview ? 'w-1/2' : 'w-full'} h-full p-5 resize-none focus:outline-none editor-area text-sm`}
                style={{ borderRight: showPreview ? '1px solid var(--border)' : 'none' }}
                placeholder="开始写作... (Ctrl+S 保存, Ctrl+B 粗体, 支持粘贴图片)"
                spellCheck="false"
              />
              {showPreview && (
                <div className="w-1/2 h-full overflow-auto p-5 markdown-preview text-sm" />
              )}
            </div>
            <div className="flex items-center justify-between px-4 py-1.5 border-t text-[10px] shrink-0" style={{ borderColor: 'var(--border)', background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
              <span>Markdown · {wordCount} 字 · 阅读约 {readingTime(wordCount)}</span>
              <button onClick={() => setShowPreview(!showPreview)} style={{ color: 'var(--accent)' }}>
                {showPreview ? '关闭预览' : '分栏预览'}
              </button>
            </div>
          </div>
        )}

        {activePanel === 'preview' && (
          <div className="flex-1 overflow-auto p-6 lg:p-10 max-w-4xl mx-auto">
            <article className="markdown-preview leading-relaxed" dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
          </div>
        )}

        {activePanel === 'settings' && (
          <div className="flex-1 overflow-auto p-6 max-w-2xl mx-auto">
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>文章标题</label>
                <input type="text" value={metadata.title || ''} onChange={e => handleMetaChange('title', e.target.value)} className="input" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>发布日期</label>
                  <input type="datetime-local" value={metadata.date ? new Date(metadata.date).toISOString().slice(0, 16) : ''} onChange={e => handleMetaChange('date', e.target.value)} className="input" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>永久链接</label>
                  <input type="text" value={metadata.abbrlink || ''} onChange={e => handleMetaChange('abbrlink', e.target.value)} className="input" placeholder="可选" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>文章描述</label>
                <textarea value={metadata.description || ''} onChange={e => handleMetaChange('description', e.target.value)} rows={3} className="input resize-none" placeholder="文章简短描述..." />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>封面图片 URL</label>
                <div className="flex gap-3">
                  <input type="text" value={metadata.cover || metadata.top_img || ''} onChange={e => { handleMetaChange('cover', e.target.value); handleMetaChange('top_img', e.target.value); }} className="input flex-1" placeholder="https://..." />
                  {(metadata.cover || metadata.top_img) && (
                    <div className="w-20 h-10 rounded-lg overflow-hidden shrink-0" style={{ border: '1px solid var(--border)' }}>
                      <img src={metadata.cover || metadata.top_img} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>标签</label>
                <input type="text" value={Array.isArray(metadata.tags) ? metadata.tags.join(', ') : metadata.tags || ''} onChange={e => handleMetaChange('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))} className="input" placeholder="Tag1, Tag2" />
                <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>逗号分隔</p>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>分类</label>
                <input type="text" value={Array.isArray(metadata.categories) ? metadata.categories.join(', ') : metadata.categories || ''} onChange={e => handleMetaChange('categories', e.target.value.split(',').map(t => t.trim()).filter(Boolean))} className="input" placeholder="Category1, Category2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!!metadata.top} onChange={e => handleMetaChange('top', e.target.checked)} className="rounded border-gray-300" />
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>置顶文章</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={metadata.comments !== false} onChange={e => handleMetaChange('comments', e.target.checked)} className="rounded border-gray-300" />
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>开启评论</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
