import React, { useState, useEffect, useRef } from 'react';
import { apiGet, apiDelete, apiUpload, formatFileSize, formatDate } from '../utils/api';
import { useToast } from './Toast';

export default function MediaManager() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [search, setSearch] = useState('');
  const fileInputRef = useRef(null);
  const toast = useToast();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchImages(); }, []);

  const fetchImages = async () => {
    try { setImages(await apiGet('/api/media')); }
    catch { toast.error('加载图片失败'); }
    finally { setLoading(false); }
  };

  const handleUpload = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        await apiUpload('/api/upload', formData);
      }
      toast.success(`成功上传 ${files.length} 个文件`);
      fetchImages();
    } catch { toast.error('上传失败'); }
    finally { setUploading(false); }
  };

  const handleDelete = async (filename) => {
    if (!confirm(`确定删除 ${filename}？`)) return;
    try {
      await apiDelete(`/api/media/${encodeURIComponent(filename)}`);
      toast.success('已删除');
      fetchImages();
      if (preview?.name === filename) setPreview(null);
    } catch { toast.error('删除失败'); }
  };

  const copy = (text) => { navigator.clipboard.writeText(text); toast.success('已复制'); };

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    if (e.dataTransfer.files?.length > 0) handleUpload(e.dataTransfer.files);
  };

  const filtered = images.filter(img => !search || img.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return (
    <div className="space-y-4">
      <div className="skeleton h-32 rounded-xl" />
      <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
        {[...Array(10)].map((_, i) => <div key={i} className="skeleton aspect-square rounded-xl" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>媒体库</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>共 {images.length} 个文件</p>
        </div>
        <div className="flex gap-2">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索文件名..." className="input input-sm w-48" />
          <input ref={fileInputRef} type="file" onChange={e => handleUpload(e.target.files)} className="hidden" accept="image/*" multiple />
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="btn btn-primary text-sm">
            {uploading ? '上传中...' : '上传图片'}
          </button>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${dragActive ? 'border-[var(--accent)]' : ''}`}
        style={{ borderColor: dragActive ? 'var(--accent)' : 'var(--border-strong)', background: dragActive ? 'var(--accent-bg)' : 'transparent' }}
      >
        <svg className="w-10 h-10 mx-auto mb-2" style={{ color: dragActive ? 'var(--accent)' : 'var(--text-muted)', opacity: 0.5 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>拖拽图片到此处上传，或点击选择文件</p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>支持 JPG, PNG, GIF, WebP, SVG</p>
      </div>

      {/* Image Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
          <p className="text-sm">{search ? '未找到匹配文件' : '暂无图片'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map(img => (
            <div key={img.name} className="glass group overflow-hidden p-0">
              <div className="aspect-square relative cursor-pointer" style={{ background: 'var(--bg-hover)' }} onClick={() => setPreview(img)}>
                <img src={img.url} alt={img.name} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button onClick={e => { e.stopPropagation(); copy(img.url); }} className="p-2 bg-white/90 rounded-lg shadow-sm hover:bg-white" style={{ color: 'var(--text-primary)' }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                  </button>
                  <button onClick={e => { e.stopPropagation(); handleDelete(img.name); }} className="p-2 bg-red-500/90 rounded-lg shadow-sm text-white hover:bg-red-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
              <div className="px-2.5 py-2">
                <p className="text-[10px] font-medium truncate" style={{ color: 'var(--text-secondary)' }}>{img.name}</p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{formatFileSize(img.size)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setPreview(null)}>
          <div className="max-w-4xl max-h-[90vh] mx-4 relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreview(null)} className="absolute -top-10 right-0 text-white/70 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <img src={preview.url} alt={preview.name} className="max-w-full max-h-[80vh] rounded-xl shadow-2xl" />
            <div className="mt-3 flex items-center justify-between text-white/80">
              <div>
                <p className="text-sm font-medium">{preview.name}</p>
                <p className="text-xs text-white/50">{formatFileSize(preview.size)} · {formatDate(preview.modified)}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => copy(preview.url)} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs">复制链接</button>
                <button onClick={() => copy(`![${preview.name}](${preview.url})`)} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs">复制 Markdown</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
